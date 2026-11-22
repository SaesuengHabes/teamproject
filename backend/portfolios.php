<?php
/* 
   backend/portfolios.php — "โต๊ะ Portfolio"
   GET                          → ส่ง Portfolio ทั้งหมด
   POST displayName, ...        → เพิ่ม Portfolio ใหม่ 1 คน
   POST action=delete, id       → ลบ Portfolio นั้น

   รับค่าด้วย $_POST (JavaScript ส่งด้วย fetch + FormData) แล้วตอบกลับเป็น JSON
    */
require 'storage.php';

// GET: แสดงสมุดทั้งเล่ม
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    sendJson(readPortfolios());
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['error' => 'ใช้ได้แค่ GET หรือ POST'], 405);
}

$action = $_POST['action'] ?? 'create';

// POST action=delete: ลบ Portfolio 1 คน
if ($action === 'delete') {
    $portfolios = readPortfolios();                       // 1. อ่าน
    $index = findPortfolioIndex($portfolios, (string)($_POST['id'] ?? ''));
    if ($index === -1) {
        sendJson(['error' => 'ไม่พบ Portfolio'], 404);
    }
    $removed = $portfolios[$index];
    array_splice($portfolios, $index, 1);                 // 2. เอาออก 1 คน
    writePortfolios($portfolios);                         // 3. เขียน
    sendJson($removed);
}

// POST: เพิ่ม Portfolio ใหม่ 1 คน
$portfolio = buildPortfolio($_POST);
if ($portfolio === null) {
    sendJson(['error' => 'ต้องกรอก Display name'], 400);
}
foreach (['whatIEnjoy', 'whatIveTried', 'whatImCuriousAbout'] as $field) {
    if ($portfolio[$field] === '' && ($_POST['import'] ?? '') !== '1') {
        sendJson(['error' => "ต้องกรอก $field"], 400);
    }
}

// $portfolios = readPortfolios();   // 1. อ่าน
// $portfolios[] = $portfolio;       // 2. เพิ่ม 1 คน
// writePortfolios($portfolios);     // 3. เขียน
// sendJson($portfolio, 201);
$portfolios = readPortfolios(); // 1. อ่านข้อมูล Portfolio ทั้งหมด

// 2. เตรียมชื่อ Portfolio ใหม่
$newName = function_exists('mb_strtolower')
    ? mb_strtolower(trim($portfolio['displayName']), 'UTF-8')
    : strtolower(trim($portfolio['displayName']));

// 3. ตรวจสอบชื่อซ้ำกับ Portfolio ที่มีอยู่
foreach ($portfolios as $existingPortfolio) {

    $existingName = function_exists('mb_strtolower')
        ? mb_strtolower(trim($existingPortfolio['displayName'] ?? ''), 'UTF-8')
        : strtolower(trim($existingPortfolio['displayName'] ?? ''));

    // พบชื่อซ้ำ ไม่อนุญาตให้สร้าง
    if ($newName === $existingName) {
        sendJson([
            'error' => 'Portfolio นี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น'
        ], 409);
    }
}

// 4. เพิ่ม Portfolio เมื่อไม่พบข้อมูลซ้ำ
$portfolios[] = $portfolio;

// 5. บันทึกข้อมูล
writePortfolios($portfolios);

// 6. ส่งข้อมูลกลับไปยังหน้าเว็บไซต์
sendJson($portfolio, 201);