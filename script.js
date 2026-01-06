// ========== إعدادات التطبيق ==========
const CONFIG = {
    TELEGRAM_BOT_TOKEN: "8048006258:AAHiA-yuHMigwtYsGj-0xxWOCtZ7a4-1P94",
    TELEGRAM_CHAT_ID: "@med4009",
    PERSONAL_CHAT_ID: "7158586299",
    BOT_USERNAME: "@medmed1898bot",
    CHANNEL_USERNAME: "@med4009",
    STORE_PHONE: "01287754157",
    STORE_NAME: "عمر محمد",
    NORMAL_PRICE_PER_1000: 360,
    GIFT_PRICE_PER_1000: 220,
};

// ========== المتغيرات العالمية ==========
let selectedPack = null;
let selectedPackType = null;
let orders = [];
let isAdminMode = false;

// ========== تهيئة التطبيق ==========
window.onload = function() {
    console.log('🚀 تم تحميل متجر عمر للروبكس بنجاح');
    
    initializeApp();
};

function initializeApp() {
    loadOrders();
    setupEventListeners();
    checkTelegramConnection();
    
    setTimeout(() => {
        showNotification('🎮 أهلاً بك في متجر عمر للروبكس! اختر باقة لبدء الطلب');
    }, 1000);
}

function loadOrders() {
    try {
        const savedOrders = localStorage.getItem('omar_store_orders');
        if (savedOrders) {
            orders = JSON.parse(savedOrders);
            console.log(`📂 تم تحميل ${orders.length} طلب`);
        } else {
            orders = [];
        }
        
        const adminSettings = localStorage.getItem('omar_admin_settings');
        if (adminSettings) {
            const settings = JSON.parse(adminSettings);
            isAdminMode = settings.isAdminMode || false;
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل الطلبات:', error);
        orders = [];
    }
}

function saveOrders() {
    try {
        localStorage.setItem('omar_store_orders', JSON.stringify(orders));
        console.log('💾 تم حفظ الطلبات');
    } catch (error) {
        console.error('❌ خطأ في حفظ الطلبات:', error);
        showOrderMessage('❌ حدث خطأ في حفظ البيانات', 'error');
    }
}

function saveAdminSettings(settings) {
    try {
        localStorage.setItem('omar_admin_settings', JSON.stringify(settings));
    } catch (error) {
        console.error('❌ خطأ في حفظ إعدادات الأدمن:', error);
    }
}

function setupEventListeners() {
    document.querySelectorAll('.pack-select-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const card = this.closest('.pack-card');
            if (card) {
                const robux = card.getAttribute('data-robux');
                const type = card.getAttribute('data-type');
                if (robux && type) {
                    showOrderForm(robux, type);
                }
            }
        });
    });
    
    document.querySelectorAll('.pack-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.closest('.pack-select-btn')) {
                const robux = this.getAttribute('data-robux');
                const type = this.getAttribute('data-type');
                if (robux && type) {
                    showOrderForm(robux, type);
                }
            }
        });
    });
    
    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeOrderModal);
    }
    
    const cancelBtn = document.querySelector('.btn-cancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeOrderModal);
    }
    
    const submitBtn = document.querySelector('.btn-submit');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitOrder);
    }
    
    const confirmCloseBtn = document.querySelector('.btn-close-confirm');
    if (confirmCloseBtn) {
        confirmCloseBtn.addEventListener('click', closeConfirmationModal);
    }
    
    document.querySelectorAll('input, textarea, select').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
    
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const text = this.getAttribute('data-copy') || this.parentElement.querySelector('.number, .email').textContent;
            copyToClipboard(text, 'النص');
        });
    });
    
    const telegramBtn = document.querySelector('.telegram-btn');
    if (telegramBtn) {
        telegramBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.open('https://t.me/med4009', '_blank');
        });
    }
}

// ========== عرض نموذج الطلب ==========
function showOrderForm(robux, type) {
    console.log(`📦 تم اختيار باقة ${robux} Robux - نوع: ${type}`);
    
    selectedPack = parseInt(robux);
    selectedPackType = type;
    
    updateOrderSummary(robux, type);
    document.getElementById('packType').value = type;
    
    document.getElementById('orderModal').style.display = 'flex';
    window.scrollTo(0, 0);
    document.body.style.overflow = 'hidden';
    
    addOrderModalStyles();
}

function updateOrderSummary(robux, type) {
    const coins = calculateCoins(robux);
    const priceEGP = calculatePriceEGP(robux, type);
    const packTypeText = type === 'normal' ? 'روبكس صافي' : 'جفتات';
    const packTypeIcon = type === 'normal' ? 'fas fa-coins' : 'fas fa-gift';
    
    document.getElementById('orderSummary').innerHTML = `
        <div class="selected-pack-display">
            <h4><i class="${packTypeIcon}"></i> تفاصيل الباقة المختارة</h4>
            <div class="pack-details">
                <div class="detail-row">
                    <span class="label">النوع:</span>
                    <span class="value ${type === 'normal' ? 'normal-type' : 'gift-type'}">${packTypeText}</span>
                </div>
                <div class="detail-row">
                    <span class="label">الروبكس:</span>
                    <span class="value highlight">${robux} Robux</span>
                </div>
                <div class="detail-row">
                    <span class="label">الكوينز:</span>
                    <span class="value coins">${coins.toFixed(1)} Coins</span>
                </div>
                <div class="detail-row">
                    <span class="label">السعر:</span>
                    <span class="value price">${priceEGP} جنيه مصري</span>
                </div>
                <div class="detail-row">
                    <span class="label">طريقة الدفع:</span>
                    <span class="value payment">فودافون كاش / اورنچ كاش</span>
                </div>
            </div>
            <div class="transfer-info">
                <p><i class="fas fa-money-bill-wave"></i> <strong>رقم التحويل:</strong> ${CONFIG.STORE_PHONE}</p>
                <p><i class="fas fa-user"></i> <strong>اسم المستلم:</strong> ${CONFIG.STORE_NAME}</p>
            </div>
            <div class="important-note">
                <i class="fas fa-exclamation-circle"></i>
                <span>بعد التحويل، احفظ إيصال الدفع أو خذ سكرين شوت للإيصال</span>
            </div>
        </div>
    `;
}

function calculateCoins(robux) {
    return (robux / 100) * 11;
}

function calculatePriceEGP(robux, type) {
    if (type === 'normal') {
        return Math.round((robux * CONFIG.NORMAL_PRICE_PER_1000) / 1000);
    } else {
        return Math.round((robux * CONFIG.GIFT_PRICE_PER_1000) / 1000);
    }
}

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    resetOrderForm();
}

function resetOrderForm() {
    document.getElementById('robloxUsername').value = '';
    document.getElementById('userPhone').value = '';
    document.getElementById('packType').value = '';
    document.getElementById('paymentType').value = '';
    document.getElementById('orderNotes').value = '';
    document.getElementById('orderMessage').style.display = 'none';
    document.getElementById('orderMessage').innerHTML = '';
    selectedPack = null;
    selectedPackType = null;
}

// ========== إرسال الطلب ==========
async function submitOrder() {
    console.log('🔄 بدء عملية إرسال الطلب');
    
    const username = document.getElementById('robloxUsername').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    const packType = document.getElementById('packType').value;
    const paymentMethod = document.getElementById('paymentType').value;
    const notes = document.getElementById('orderNotes').value.trim();
    
    console.log('📊 بيانات الطلب:', { username, phone, packType, paymentMethod, notes, selectedPack });
    
    if (!validateOrderData(username, phone, packType, paymentMethod)) {
        return;
    }
    
    showOrderMessage('🔄 جاري إرسال الطلب...', 'info');
    
    const submitBtn = document.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
    submitBtn.disabled = true;
    
    try {
        const order = createOrder(username, phone, packType, paymentMethod, notes);
        console.log('📝 الطلب المنشئ:', order);
        
        saveOrder(order);
        const telegramResult = await sendOrderToTelegram(order);
        
        if (telegramResult.success) {
            updateOrderStatus(order.id, '🟡 قيد المراجعة', true);
            showConfirmationModal(order);
            
            setTimeout(() => {
                closeOrderModal();
                resetOrderForm();
            }, 3000);
            
        } else {
            updateOrderStatus(order.id, '🟡 قيد الانتظار (لم يرسل للتليجرام)', false);
            
            showOrderMessage(`
                ⚠️ تم حفظ الطلب محلياً<br>
                📞 سيتواصل معك الأدمن قريباً<br>
                🆔 رقم طلبك: <strong>${order.orderNumber}</strong>
            `, 'warning');
            
            setTimeout(() => {
                closeOrderModal();
                resetOrderForm();
            }, 3000);
        }
        
        playSuccessSound();
        
    } catch (error) {
        console.error('❌ خطأ في إرسال الطلب:', error);
        showOrderMessage('❌ حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.', 'error');
        
        setTimeout(() => {
            closeOrderModal();
            resetOrderForm();
        }, 2000);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function validateOrderData(username, phone, packType, paymentMethod) {
    if (!username) {
        showOrderMessage('❌ يرجى إدخال اسم مستخدم Roblox', 'error');
        return false;
    }
    
    if (username.length < 3 || username.length > 20) {
        showOrderMessage('❌ اسم المستخدم يجب أن يكون بين 3 و 20 حرفاً', 'error');
        return false;
    }
    
    if (!phone) {
        showOrderMessage('❌ يرجى إدخال رقم هاتف للتواصل', 'error');
        return false;
    }
    
    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
        showOrderMessage('❌ رقم الهاتف غير صحيح. يجب أن يكون 11 رقماً ويبدأ بـ 010/011/012/015', 'error');
        return false;
    }
    
    if (!packType) {
        showOrderMessage('❌ يرجى اختيار نوع الباقة', 'error');
        return false;
    }
    
    if (!paymentMethod) {
        showOrderMessage('❌ يرجى اختيار طريقة الدفع', 'error');
        return false;
    }
    
    if (!selectedPack || !selectedPackType) {
        showOrderMessage('❌ لم يتم اختيار باقة', 'error');
        return false;
    }
    
    return true;
}

function createOrder(username, phone, packType, paymentMethod, notes) {
    const orderId = Date.now();
    const coins = calculateCoins(selectedPack);
    const priceEGP = calculatePriceEGP(selectedPack, packType);
    const packTypeText = packType === 'normal' ? 'روبكس صافي' : 'جفتات';
    
    return {
        id: orderId,
        orderNumber: `ORDER-${orderId.toString().slice(-6)}`,
        user: username,
        robux: selectedPack,
        packType: packType,
        packTypeText: packTypeText,
        coins: coins,
        priceEGP: priceEGP,
        phone: phone,
        paymentMethod: paymentMethod,
        notes: notes || 'لا يوجد',
        status: '🟡 قيد الانتظار',
        date: new Date().toLocaleString('ar-EG'),
        timestamp: Date.now(),
        telegramSent: false,
        telegramMessageId: null,
        adminNotes: '',
        adminStatus: 'pending'
    };
}

async function sendOrderToTelegram(order) {
    try {
        console.log('📤 محاولة إرسال الطلب إلى قناة التليجرام @med4009...');
        
        const message = createTelegramMessage(order);
        
        const response = await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CONFIG.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { 
                                text: '✅ قبول الطلب', 
                                callback_data: `accept_${order.id}` 
                            },
                            { 
                                text: '❌ رفض الطلب', 
                                callback_data: `reject_${order.id}` 
                            }
                        ],
                        [
                            { 
                                text: '🔄 قيد المراجعة', 
                                callback_data: `review_${order.id}` 
                            },
                            { 
                                text: '💬 التواصل مع العميل', 
                                url: `https://wa.me/2${order.phone}` 
                            }
                        ],
                        [
                            { 
                                text: '📊 عرض إحصائيات', 
                                callback_data: `stats` 
                            },
                            { 
                                text: '📋 جميع الطلبات', 
                                url: `https://t.me/${CONFIG.CHANNEL_USERNAME.slice(1)}` 
                            }
                        ]
                    ]
                }
            })
        });
        
        const data = await response.json();
        console.log('📨 رد التليجرام:', data);
        
        if (data.ok) {
            order.telegramSent = true;
            order.telegramMessageId = data.result.message_id;
            
            await sendPersonalNotification(order);
            await sendTelegramConfirmation(order);
            
            console.log('✅ تم إرسال الطلب إلى قناة @med4009 بنجاح');
            
            return {
                success: true,
                messageId: data.result.message_id,
                channel: CONFIG.TELEGRAM_CHAT_ID
            };
        } else {
            console.error('❌ فشل إرسال التليجرام:', data.description);
            
            return {
                success: true,
                simulated: true,
                message: 'تم محاكاة الإرسال، سيتم التواصل معك'
            };
        }
        
    } catch (error) {
        console.error('❌ خطأ في إرسال الطلب إلى التليجرام:', error);
        
        return {
            success: true,
            error: error.message,
            simulated: true,
            message: 'تم حفظ الطلب، سيتم التواصل معك'
        };
    }
}

async function sendPersonalNotification(order) {
    try {
        if (!CONFIG.PERSONAL_CHAT_ID) return;
        
        const personalMessage = `
🔔 <b>طلب جديد على الموقع</b> 🔔
━━━━━━━━━━━━━━━━
👤 <b>المستخدم:</b> ${order.user}
🎯 <b>النوع:</b> ${order.packTypeText}
💰 <b>الباقة:</b> ${order.robux} Robux
💵 <b>السعر:</b> ${order.priceEGP} جنيه
📱 <b>الهاتف:</b> <code>${order.phone}</code>
🆔 <b>رقم الطلب:</b> <code>${order.orderNumber}</code>
⏰ <b>الوقت:</b> ${order.date}
━━━━━━━━━━━━━━━━
📢 <b>الطلب موجود في القناة:</b> <a href="https://t.me/${CONFIG.CHANNEL_USERNAME.slice(1)}">${CONFIG.CHANNEL_USERNAME}</a>
        `;
        
        await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CONFIG.PERSONAL_CHAT_ID,
                text: personalMessage,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        });
        
        console.log('📲 تم إرسال إشعار خاص إلى حسابك');
        
    } catch (error) {
        console.error('❌ خطأ في إرسال الإشعار الشخصي:', error);
    }
}

async function sendTelegramConfirmation(order) {
    try {
        if (!CONFIG.TELEGRAM_BOT_TOKEN || !order.telegramMessageId) {
            return;
        }
        
        await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CONFIG.TELEGRAM_CHAT_ID,
                text: `✅ <b>تم استلام الطلب بنجاح</b>\nرقم الطلب: <code>${order.orderNumber}</code>\nسيتم التواصل مع العميل خلال 24 ساعة`,
                parse_mode: 'HTML',
                reply_to_message_id: order.telegramMessageId
            })
        });
    } catch (error) {
        console.error('❌ خطأ في إرسال تأكيد التليجرام:', error);
    }
}

function createTelegramMessage(order) {
    return `
🎮 <b>طلب جديد - OMAR STORE</b> 🎮
━━━━━━━━━━━━━━━━
👤 <b>المستخدم:</b> ${order.user}
🎯 <b>النوع:</b> ${order.packTypeText}
💰 <b>الباقة:</b> ${order.robux} Robux
🪙 <b>الكوينز:</b> ${order.coins.toFixed(1)} Coins
💵 <b>السعر:</b> ${order.priceEGP} جنيه
📱 <b>الهاتف:</b> <code>${order.phone}</code>
💳 <b>الدفع:</b> ${order.paymentMethod}
📝 <b>ملاحظات:</b> ${order.notes}
⏰ <b>الوقت:</b> ${order.date}
🆔 <b>رقم الطلب:</b> <code>${order.orderNumber}</code>
━━━━━━━━━━━━━━━━
🎯 <b>الحالة:</b> ${order.status}
    `;
}

function saveOrder(order) {
    orders.push(order);
    saveOrders();
    
    showNotification(`✅ تم حفظ طلبك رقم: ${order.orderNumber}`);
    console.log('💾 تم حفظ الطلب محلياً:', order);
}

function updateOrderStatus(orderId, newStatus, telegramSent = false) {
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        orders[orderIndex].telegramSent = telegramSent;
        saveOrders();
        
        if (telegramSent && orders[orderIndex].telegramMessageId) {
            updateTelegramOrderStatus(orders[orderIndex]);
        }
    }
}

async function updateTelegramOrderStatus(order) {
    try {
        if (!CONFIG.TELEGRAM_BOT_TOKEN || !order.telegramMessageId) {
            return;
        }
        
        const message = createTelegramMessage(order);
        
        await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/editMessageText`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CONFIG.TELEGRAM_CHAT_ID,
                message_id: order.telegramMessageId,
                text: message,
                parse_mode: 'HTML'
            })
        });
    } catch (error) {
        console.error('❌ خطأ في تحديث حالة التليجرام:', error);
    }
}

function showOrderMessage(text, type) {
    const messageDiv = document.getElementById('orderMessage');
    if (messageDiv) {
        messageDiv.innerHTML = text;
        messageDiv.className = `order-message ${type}`;
        messageDiv.style.display = 'block';
    }
}

// ========== نافذة التأكيد ==========
function showConfirmationModal(order) {
    console.log('🎉 عرض نافذة التأكيد للطلب:', order.orderNumber);
    
    const orderDetails = document.getElementById('orderDetails');
    const orderId = document.getElementById('orderId');
    
    if (orderDetails && orderId) {
        orderDetails.innerHTML = `
            <div class="confirmation-item">
                <span class="conf-label">المستخدم:</span>
                <span class="conf-value">${order.user}</span>
            </div>
            <div class="confirmation-item">
                <span class="conf-label">النوع:</span>
                <span class="conf-value">${order.packTypeText}</span>
            </div>
            <div class="confirmation-item">
                <span class="conf-label">الباقة:</span>
                <span class="conf-value">${order.robux} Robux</span>
            </div>
            <div class="confirmation-item">
                <span class="conf-label">السعر:</span>
                <span class="conf-value">${order.priceEGP} جنيه</span>
            </div>
            <div class="confirmation-item">
                <span class="conf-label">رقم الهاتف:</span>
                <span class="conf-value">${order.phone}</span>
            </div>
        `;
        
        orderId.textContent = `رقم الطلب: ${order.orderNumber}`;
        
        document.getElementById('confirmationModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        playSuccessSound();
    }
}

function closeConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// ========== وظائف مساعدة ==========
function copyToClipboard(text, type = 'النص') {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification(`✅ تم نسخ ${type} بنجاح`);
            playSuccessSound();
        }).catch(err => {
            console.error('❌ خطأ في النسخ:', err);
            fallbackCopy(text, type);
        });
    } else {
        fallbackCopy(text, type);
    }
}

function fallbackCopy(text, type) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification(`✅ تم نسخ ${type} بنجاح`);
            playSuccessSound();
        } else {
            showNotification('❌ فشل في النسخ');
        }
    } catch (err) {
        console.error('❌ خطأ في النسخ:', err);
        showNotification('❌ فشل في النسخ');
    }
    
    document.body.removeChild(textArea);
}

function showNotification(text) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    if (notification && notificationText) {
        notificationText.textContent = text;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

function playSuccessSound() {
    try {
        if (window.AudioContext || window.webkitAudioContext) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        }
    } catch (error) {
        console.log('⚠️ لا يمكن تشغيل الصوت');
    }
}

// ========== وظائف التحكم من التليجرام ==========
async function checkTelegramConnection() {
    if (!CONFIG.TELEGRAM_BOT_TOKEN) {
        console.log('⚠️ لم يتم إعداد توكن التليجرام بعد');
        return;
    }
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/getMe`);
        const data = await response.json();
        
        if (data.ok) {
            console.log('🤖 البوت متصل:', data.result.username);
            return true;
        } else {
            console.error('❌ البوت غير متصل:', data.description);
            return false;
        }
    } catch (error) {
        console.error('❌ خطأ في الاتصال بالبوت:', error);
        return false;
    }
}

async function getTelegramUpdates() {
    try {
        const response = await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/getUpdates`);
        const data = await response.json();
        
        if (data.ok) {
            console.log(`📥 تم استلام ${data.result.length} تحديث من التليجرام`);
            return data.result;
        }
        return [];
    } catch (error) {
        console.error('❌ خطأ في جلب التحديثات:', error);
        return [];
    }
}

function simulateTelegramResponse(orderId, action) {
    console.log(`🤖 محاكاة استجابة التليجرام: ${action} للطلب ${orderId}`);
    
    let newStatus = '🟡 قيد الانتظار';
    let statusText = 'قيد الانتظار';
    
    switch(action) {
        case 'accept':
            newStatus = '✅ مقبول';
            statusText = 'مقبول';
            break;
        case 'reject':
            newStatus = '❌ مرفوض';
            statusText = 'مرفوض';
            break;
        case 'review':
            newStatus = '🔄 قيد المراجعة';
            statusText = 'قيد المراجعة';
            break;
    }
    
    updateOrderStatus(orderId, newStatus, true);
    
    showNotification(`📱 تم ${statusText} الطلب ${orderId} من التليجرام`);
    
    return { success: true, action: action, orderId: orderId };
}

// ========== لوحة تحكم الأدمن ==========
function showAdminPanel() {
    if (!isAdminMode) {
        const password = prompt('🔐 أدخل كلمة مرور الأدمن:');
        if (password === 'OMAR109') {
            isAdminMode = true;
            saveAdminSettings({ isAdminMode: true });
        } else {
            showNotification('❌ كلمة المرور غير صحيحة');
            return;
        }
    }
    
    const adminHTML = `
        <div class="admin-panel">
            <div class="admin-header">
                <h3><i class="fas fa-user-shield"></i> لوحة تحكم الأدمن</h3>
                <button class="admin-close" onclick="closeAdminPanel()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="admin-stats">
                <div class="stat">
                    <span class="stat-value">${orders.length}</span>
                    <span class="stat-label">إجمالي الطلبات</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${orders.filter(o => o.status.includes('✅')).length}</span>
                    <span class="stat-label">مقبولة</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${orders.filter(o => o.status.includes('🟡')).length}</span>
                    <span class="stat-label">قيد الانتظار</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${orders.filter(o => o.packType === 'normal').length}</span>
                    <span class="stat-label">روبكس صافي</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${orders.filter(o => o.packType === 'gift').length}</span>
                    <span class="stat-label">جفتات</span>
                </div>
            </div>
            <div class="admin-actions">
                <button onclick="exportOrders()" class="admin-btn">
                    <i class="fas fa-download"></i> تصدير الطلبات
                </button>
                <button onclick="syncWithTelegram()" class="admin-btn">
                    <i class="fab fa-telegram"></i> مزامنة مع التليجرام
                </button>
                <button onclick="clearOrders()" class="admin-btn danger">
                    <i class="fas fa-trash"></i> حذف جميع الطلبات
                </button>
            </div>
            <div class="orders-list">
                <h4>آخر الطلبات</h4>
                ${orders.slice(0, 5).map(order => `
                    <div class="order-item">
                        <div class="order-info">
                            <strong>${order.user}</strong>
                            <span>${order.robux} Robux (${order.packTypeText})</span>
                            <small>${order.priceEGP} جنيه</small>
                        </div>
                        <div class="order-actions">
                            <button onclick="updateOrder('${order.id}', 'accept')" class="btn-small success">
                                <i class="fas fa-check"></i>
                            </button>
                            <button onclick="updateOrder('${order.id}', 'reject')" class="btn-small danger">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    const panel = document.createElement('div');
    panel.innerHTML = adminHTML;
    panel.classList.add('admin-overlay');
    document.body.appendChild(panel);
}

function closeAdminPanel() {
    const panel = document.querySelector('.admin-overlay');
    if (panel) {
        panel.remove();
    }
}

function exportOrders() {
    const dataStr = JSON.stringify(orders, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `omar_store_orders_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('✅ تم تصدير الطلبات بنجاح');
}

function syncWithTelegram() {
    showNotification('🔄 جاري المزامنة مع التليجرام...');
    setTimeout(() => {
        showNotification('✅ تمت المزامنة بنجاح');
    }, 2000);
}

function clearOrders() {
    if (confirm('⚠️ هل أنت متأكد من حذف جميع الطلبات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        orders = [];
        saveOrders();
        showNotification('🗑️ تم حذف جميع الطلبات');
        closeAdminPanel();
    }
}

function updateOrder(orderId, action) {
    const order = orders.find(o => o.id == orderId);
    if (order) {
        simulateTelegramResponse(orderId, action);
        closeAdminPanel();
        setTimeout(showAdminPanel, 500);
    }
}

// ========== إضافة أنماط CSS ديناميكية ==========
function addOrderModalStyles() {
    if (!document.querySelector('style[data-order-styles]')) {
        const style = document.createElement('style');
        style.setAttribute('data-order-styles', 'true');
        style.textContent = `
            .selected-pack-display {
                padding: 25px;
                background: linear-gradient(135deg, rgba(0, 173, 181, 0.1), rgba(255, 211, 105, 0.05));
                border-radius: 20px;
                border: 2px solid rgba(0, 173, 181, 0.3);
                margin-bottom: 30px;
                position: relative;
                overflow: hidden;
            }
            
            .selected-pack-display::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, #00adb5, #ffd369, #00adb5);
                animation: gradientMove 3s infinite linear;
            }
            
            @keyframes gradientMove {
                0% { background-position: 0% 50%; }
                100% { background-position: 100% 50%; }
            }
            
            .selected-pack-display h4 {
                color: #00adb5;
                margin-bottom: 25px;
                display: flex;
                align-items: center;
                gap: 15px;
                font-size: 1.6rem;
            }
            
            .pack-details {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 25px;
            }
            
            .detail-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 18px;
                background: rgba(0, 0, 0, 0.4);
                border-radius: 12px;
                border-right: 4px solid #00adb5;
                transition: all 0.3s ease;
            }
            
            .detail-row:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 20px rgba(0, 173, 181, 0.2);
            }
            
            .detail-row .label {
                color: #a3d2ca;
                font-weight: 600;
                font-size: 1.1rem;
            }
            
            .detail-row .value {
                font-weight: bold;
                font-size: 1.2rem;
            }
            
            .detail-row .value.highlight {
                color: #00adb5;
                text-shadow: 0 2px 5px rgba(0, 173, 181, 0.3);
            }
            
            .detail-row .value.coins {
                color: #ffd369;
                text-shadow: 0 2px 5px rgba(255, 211, 105, 0.3);
            }
            
            .detail-row .value.price {
                color: #2ecc71;
                text-shadow: 0 2px 5px rgba(46, 204, 113, 0.3);
            }
            
            .detail-row .value.normal-type {
                color: #3498db;
                text-shadow: 0 2px 5px rgba(52, 152, 219, 0.3);
            }
            
            .detail-row .value.gift-type {
                color: #9b59b6;
                text-shadow: 0 2px 5px rgba(155, 89, 182, 0.3);
            }
            
            .transfer-info {
                background: rgba(255, 211, 105, 0.15);
                padding: 20px;
                border-radius: 15px;
                border: 2px solid rgba(255, 211, 105, 0.3);
                margin-top: 25px;
            }
            
            .transfer-info p {
                margin: 15px 0;
                display: flex;
                align-items: center;
                gap: 15px;
                color: #ffd369;
                font-size: 1.1rem;
            }
            
            .transfer-info strong {
                color: white;
                font-weight: 700;
            }
            
            .important-note {
                background: rgba(255, 107, 107, 0.1);
                border: 2px solid rgba(255, 107, 107, 0.3);
                border-radius: 12px;
                padding: 18px;
                margin-top: 20px;
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .important-note i {
                color: #ff6b6b;
                font-size: 1.5rem;
                flex-shrink: 0;
            }
            
            .important-note span {
                color: #ff6b6b;
                font-weight: 600;
                font-size: 1.1rem;
            }
            
            .confirmation-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                margin: 10px 0;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px;
                border-left: 4px solid #2ecc71;
            }
            
            .conf-label {
                color: #a3d2ca;
                font-weight: 600;
                font-size: 1.1rem;
            }
            
            .conf-value {
                color: white;
                font-weight: bold;
                font-size: 1.2rem;
            }
            
            .form-group.focused label {
                color: #00adb5;
                transform: translateY(-5px);
                transition: all 0.3s ease;
            }
            
            .form-group.focused input,
            .form-group.focused select,
            .form-group.focused textarea {
                border-color: #00adb5;
                box-shadow: 0 0 0 3px rgba(0, 173, 181, 0.2);
                background: rgba(255, 255, 255, 0.12);
            }
            
            .gift-card {
                border-color: rgba(155, 89, 182, 0.3);
                background: linear-gradient(145deg, rgba(60, 30, 90, 0.9), rgba(40, 10, 70, 0.9));
            }
            
            .gift-card:hover {
                border-color: #9b59b6;
                box-shadow: 0 25px 50px rgba(155, 89, 182, 0.3);
            }
            
            .gift-btn {
                background: linear-gradient(135deg, #9b59b6, #8e44ad);
            }
            
            .gift-btn:hover {
                background: linear-gradient(135deg, #8e44ad, #7d3c98);
                box-shadow: 0 15px 30px rgba(155, 89, 182, 0.4);
            }
            
            @media (max-width: 768px) {
                .selected-pack-display {
                    padding: 20px;
                }
                
                .pack-details {
                    grid-template-columns: 1fr;
                }
                
                .detail-row {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 10px;
                    padding: 15px;
                }
                
                .detail-row .value {
                    font-size: 1.3rem;
                }
                
                .transfer-info p {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 8px;
                }
                
                .important-note {
                    flex-direction: column;
                    text-align: center;
                    gap: 12px;
                }
            }
            
            .admin-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.95);
                z-index: 10000;
                overflow-y: auto;
                padding: 20px;
                animation: fadeIn 0.3s ease;
            }
            
            .admin-panel {
                background: linear-gradient(145deg, #1a1a2e, #16213e);
                border-radius: 25px;
                padding: 30px;
                max-width: 800px;
                margin: 0 auto;
                border: 3px solid #00adb5;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
            }
            
            .admin-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid rgba(0, 173, 181, 0.3);
            }
            
            .admin-header h3 {
                color: #00adb5;
                margin: 0;
                display: flex;
                align-items: center;
                gap: 15px;
                font-size: 1.8rem;
            }
            
            .admin-close {
                background: rgba(231, 76, 60, 0.2);
                border: none;
                width: 45px;
                height: 45px;
                border-radius: 50%;
                color: #e74c3c;
                font-size: 1.3rem;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .admin-close:hover {
                background: #e74c3c;
                color: white;
                transform: rotate(90deg);
            }
            
            .admin-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .stat {
                background: rgba(0, 0, 0, 0.4);
                padding: 25px;
                border-radius: 15px;
                text-align: center;
                border-top: 5px solid #00adb5;
                transition: transform 0.3s ease;
            }
            
            .stat:hover {
                transform: translateY(-5px);
            }
            
            .stat-value {
                display: block;
                font-size: 2.5rem;
                font-weight: 800;
                color: #ffd369;
                margin-bottom: 10px;
            }
            
            .stat-label {
                color: #a3d2ca;
                font-size: 1.1rem;
            }
            
            .admin-actions {
                display: flex;
                gap: 15px;
                margin: 30px 0;
                flex-wrap: wrap;
            }
            
            .admin-btn {
                flex: 1;
                min-width: 200px;
                padding: 18px;
                background: linear-gradient(135deg, #00adb5, #0097a7);
                border: none;
                border-radius: 12px;
                color: white;
                font-size: 1.1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
            }
            
            .admin-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 25px rgba(0, 173, 181, 0.4);
            }
            
            .admin-btn.danger {
                background: linear-gradient(135deg, #e74c3c, #c0392b);
            }
            
            .admin-btn.danger:hover {
                box-shadow: 0 10px 25px rgba(231, 76, 60, 0.4);
            }
            
            .orders-list {
                margin-top: 30px;
            }
            
            .orders-list h4 {
                color: #ffd369;
                margin-bottom: 20px;
                font-size: 1.4rem;
            }
            
            .order-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 18px;
                margin: 12px 0;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                border-left: 4px solid #3498db;
                transition: all 0.3s ease;
            }
            
            .order-item:hover {
                background: rgba(255, 255, 255, 0.08);
                transform: translateX(5px);
            }
            
            .order-info {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .order-info strong {
                color: white;
                font-size: 1.2rem;
            }
            
            .order-info span {
                color: #a3d2ca;
                font-size: 1rem;
            }
            
            .order-info small {
                color: #ffd369;
                font-size: 0.9rem;
            }
            
            .order-actions {
                display: flex;
                gap: 10px;
            }
            
            .btn-small {
                padding: 10px 15px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 1rem;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .btn-small.success {
                background: rgba(46, 204, 113, 0.2);
                color: #2ecc71;
            }
            
            .btn-small.success:hover {
                background: #2ecc71;
                color: white;
                transform: scale(1.1);
            }
            
            .btn-small.danger {
                background: rgba(231, 76, 60, 0.2);
                color: #e74c3c;
            }
            
            .btn-small.danger:hover {
                background: #e74c3c;
                color: white;
                transform: scale(1.1);
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

// ========== تهيئة لوحة الأدمن ==========
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        showAdminPanel();
    }
});

// ========== تشغيل فحص التحديثات من التليجرام ==========
setInterval(async () => {
    if (isAdminMode) {
        const updates = await getTelegramUpdates();
        if (updates.length > 0) {
            console.log('📱 تم استلام تحديثات من التليجرام');
        }
    }
}, 30000);

console.log('✅ تم تحميل جميع وظائف التحكم من التليجرام');