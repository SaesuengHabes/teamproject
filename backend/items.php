<?php
/*
   backend/items.php — จัดการ Portfolio Item ผ่าน JSON API
   POST portfolioId, title, ...                   -> เพิ่ม Item
   POST action=update, portfolioId, itemId, ...   -> แก้ไข Item
   POST action=delete, portfolioId, itemId        -> ลบ Item
*/
require __DIR__ . '/storage.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    sendJson(['error' => 'ใช้ได้แค่ POST'], 405);
}

$action = $_POST['action'] ?? 'create';
$portfolioId = (string)($_POST['portfolioId'] ?? '');
$itemId = (string)($_POST['itemId'] ?? '');

if (!in_array($action, ['create', 'update', 'delete'], true)) {
    sendJson(['error' => 'ไม่รู้จัก action ที่ร้องขอ'], 400);
}

// อ่านข้อมูล Portfolio
$portfolios = readPortfolios();
$p = findPortfolioIndex($portfolios, $portfolioId);

if ($p === -1) {
    sendJson(['error' => 'ไม่พบ Portfolio'], 404);
}

if (!isset($portfolios[$p]['items']) || !is_array($portfolios[$p]['items'])) {
    $portfolios[$p]['items'] = [];
}

// ---------- ลบ Item ----------
if ($action === 'delete') {
    if ($itemId === '') {
        sendJson(['error' => 'ไม่พบรหัส Item ที่ต้องการลบ'], 400);
    }

    $i = findItemIndex($portfolios[$p]['items'], $itemId);
    if ($i === -1) {
        sendJson(['error' => 'ไม่พบ Item'], 404);
    }

    // ลบ Item ออกจาก array จริง
    array_splice($portfolios[$p]['items'], $i, 1);

    // บันทึกข้อมูล และตอบกลับเป็น JSON เสมอ
    writePortfolios($portfolios);
    sendJson([
        'success' => true,
        'deletedItemId' => $itemId
    ], 200);
}

// ---------- สร้าง / แก้ไข Item ----------
$item = buildItem($_POST);
if ($item === null) {
    sendJson(['error' => 'ต้องกรอก title'], 400);
}

// Item ที่นำเข้าทีละหลายชิ้น (import=1) อาจกรอกไม่ครบ -> ตรวจแค่ title
$error = ($_POST['import'] ?? '') === '1' ? '' : checkItem($item, $_POST);
if ($error !== '') {
    sendJson(['error' => $error], 400);
}

// ตรวจสอบชื่อ Item ซ้ำใน Portfolio เดียวกัน
$checkDuplicateTitle = function ($newItem, $existingItems, $excludeItemId = '') {
    $normalizeTitle = function ($title) {
        $title = trim((string)$title);
        return function_exists('mb_strtolower')
            ? mb_strtolower($title, 'UTF-8')
            : strtolower($title);
    };

    $newTitle = $normalizeTitle($newItem['title'] ?? '');

    foreach ($existingItems as $existingItem) {
        if (
            $excludeItemId !== '' &&
            (string)($existingItem['id'] ?? '') === $excludeItemId
        ) {
            continue;
        }

        if ($newTitle === $normalizeTitle($existingItem['title'] ?? '')) {
            sendJson([
                'error' => 'Portfolio Item ชื่อนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น'
            ], 409);
        }
    }
};

if ($action === 'create') {
    $checkDuplicateTitle($item, $portfolios[$p]['items']);
    $portfolios[$p]['items'][] = $item;
    $status = 201;
} else { // update
    if ($itemId === '') {
        sendJson(['error' => 'ไม่พบรหัส Item ที่ต้องการแก้ไข'], 400);
    }

    $i = findItemIndex($portfolios[$p]['items'], $itemId);
    if ($i === -1) {
        sendJson(['error' => 'ไม่พบ Item'], 404);
    }

    $checkDuplicateTitle($item, $portfolios[$p]['items'], $itemId);
    $item['id'] = $itemId;
    $portfolios[$p]['items'][$i] = $item;
    $status = 200;
}

writePortfolios($portfolios);
sendJson($item, $status);
