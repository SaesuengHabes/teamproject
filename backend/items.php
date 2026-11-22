<?php
/* 
   backend/items.php — "โต๊ะ Item": ทำกับ Item ทีละ 1 ชิ้น ใน Portfolio ที่มี id นั้น
   POST portfolioId, title, ...                   → เพิ่ม Item ใหม่
   POST action=update, portfolioId, itemId, ...   → แก้ไข Item
   POST action=delete, portfolioId, itemId        → ลบ Item

   ช่องที่รับ (ชื่อตาม Data Contract): title, type, otherType, date, role, description,
   skills ("HTML, CSS"), whatIDid, whatILearned, challenge, nextStep, evidence (บรรทัดละ 1 ลิงก์)
    */
require 'storage.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['error' => 'ใช้ได้แค่ POST'], 405);
}

$action = $_POST['action'] ?? 'create';
$portfolioId = (string)($_POST['portfolioId'] ?? '');
$itemId = (string)($_POST['itemId'] ?? '');

// สร้าง Item จากฟอร์มก่อน (ยกเว้นตอนลบ) แล้วตรวจว่ากรอกครบ
if ($action !== 'delete') {
    $item = buildItem($_POST);
    if ($item === null) {
        sendJson(['error' => 'ต้องกรอก title'], 400);
    }
    // Item ที่นำเข้าทีละหลายชิ้น (import=1) อาจกรอกไม่ครบ → ตรวจแค่ title
    $error = ($_POST['import'] ?? '') === '1' ? '' : checkItem($item, $_POST);
    if ($error !== '') {
        sendJson(['error' => $error], 400);
    }
}

// 1. อ่าน
$portfolios = readPortfolios();
$p = findPortfolioIndex($portfolios, $portfolioId);
if ($p === -1) {
    sendJson(['error' => 'ไม่พบ Portfolio'], 404);
}
/* ---------- ตรวจสอบ Portfolio Item ซ้ำ ---------- */

$checkDuplicateTitle = function (
    $newItem,
    $existingItems,
    $excludeItemId = ''
) {
    // แปลงชื่อให้เป็นรูปแบบเดียวกันก่อนเปรียบเทียบ
    $normalizeTitle = function ($title) {
        $title = trim((string)$title);

        return function_exists('mb_strtolower')
            ? mb_strtolower($title, 'UTF-8')
            : strtolower($title);
    };

    $newTitle = $normalizeTitle($newItem['title'] ?? '');

    foreach ($existingItems as $existingItem) {

        // ข้าม Item ของตัวเองเมื่อกำลังแก้ไข
        if (
            $excludeItemId !== '' &&
            (string)($existingItem['id'] ?? '') === $excludeItemId
        ) {
            continue;
        }

        $existingTitle = $normalizeTitle(
            $existingItem['title'] ?? ''
        );

        // หากชื่อซ้ำ ให้ปฏิเสธ
        if ($newTitle === $existingTitle) {
            sendJson([
                'error' => 'Portfolio Item ชื่อนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น'
            ], 409);
        }
    }
};

// 2. เปลี่ยน 1 ชิ้น
if ($action === 'create') {

    // ตรวจสอบชื่อซ้ำก่อนเพิ่ม Item
    $checkDuplicateTitle(
        $item,
        $portfolios[$p]['items'] ?? []
    );

    $portfolios[$p]['items'][] = $item;
    $status = 201;
} else {
    $i = findItemIndex($portfolios[$p]['items'], $itemId);
    if ($i === -1) {
        sendJson(['error' => 'ไม่พบ Item'], 404);
    }
    if ($action === 'update') {

        // ตรวจสอบชื่อซ้ำ โดยข้าม Item ของตัวเอง
        $checkDuplicateTitle(
            $item,
            $portfolios[$p]['items'] ?? [],
            $itemId
        );

        $item['id'] = $itemId;
        $portfolios[$p]['items'][$i] = $item;
    }
}
// 3. เขียน
writePortfolios($portfolios);
sendJson($item, $status);
