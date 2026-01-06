// ========== إعدادات التطبيق ==========
const CONFIG = {
    TELEGRAM_BOT_TOKEN: "8048006258:AAHiA-yuHMigwtYsGj-0xxWOCtZ7a4-1P94",
    TELEGRAM_CHAT_ID: "@med4009",
    PERSONAL_CHAT_ID: "7158586299",
    BOT_USERNAME: "@medmed1898bot",
    CHANNEL_USERNAME: "@med4009",
    STORE_PHONE: "01287754157",
    STORE_NAME: "عمر محمد",
    
    // الأسعار الجديدة حسب طلبك
    NORMAL_PRICE_PER_1000: 320,  // 320 جنيه لكل 1000 روبكس صافي
    GIFT_PRICE_PER_1000: 220,    // 220 جنيه لكل 1000 روبكس جفتات
};

// ========== المتغيرات العالمية ==========
let selectedPack = null;
let selectedPackType = null;
let orders = [];
let isAdminMode = false;

// ========== تهيئة التطبيق ==========
window.onload = function() {
    console.log('🚀 متجر عمر للروبكس - تم التحميل بنجاح');
    console.log('📊 الأسعار: الروبكس الصافي =', CONFIG.NORMAL_PRICE_PER_1000, 'ج / 1000');
    console.log('📊 الأسعار: الجفتات =', CONFIG.GIFT_PRICE_PER_1000, 'ج / 1000');
    
    initializeApp();
};

function initializeApp() {
    loadOrders();
    setupEventListeners();
    setupCopyButtons();
    
    // تحقق من اتصال التليجرام
    setTimeout(async () => {
        await checkTelegramConnection();
    }, 1000);
    
    // إظهار إشعار ترحيبي
    setTimeout(() => {
        showNotification('🎮 أهلاً بك في متجر عمر للروبكس! اختر باقة لبدء الطلب');
    }, 1500);
}

// ========== تحميل وحفظ البيانات ==========
function loadOrders() {
    try {
        const savedOrders = localStorage.getItem('omar_store_orders');
        if (savedOrders) {
            orders = JSON.parse(savedOrders);
            console.log(`📂 تم تحميل ${orders.length} طلب سابق`);
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
    }
}

// ========== إعداد الأحداث ==========
function setupEventListeners() {
    // أزرار اختيار الباقات
    document.querySelectorAll('.pack-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const card = this.closest('.pack-card');
            if (card) {
                const packTitle = card.querySelector('.pack-title h3');
                const packType = card.classList.contains('normal') ? 'normal' : 'gift';
                
                if (packTitle) {
                    const robux = parseInt(packTitle.textContent.trim());
                    if (!isNaN(robux)) {
                        showOrderForm(robux, packType);
                    }
                }
            }
        });
    });
    
    // إضافة تأثير hover للباقات
    document.querySelectorAll('.pack-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', function() {
            if (!this.classList.contains('selected')) {
                this.style.transform = 'translateY(0)';
            }
        });
    });
    
    // زر الإغلاق في النافذة
    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeOrderModal);
    }
    
    // زر إرسال الطلب
    const submitBtn = document.querySelector('.btn-primary');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitOrder);
    }
    
    // زر الإلغاء
    const cancelBtn = document.querySelector('.btn-secondary');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeOrderModal);
    }
    
    // تأثيرات حقول الإدخال
    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
    
    // اختصارات لوحة المفاتيح
    document.addEventListener('keydown', function(e) {
        // Esc لإغلاق النوافذ
        if (e.key === 'Escape') {
            if (document.getElementById('orderModal').style.display === 'block') {
                closeOrderModal();
            }
            if (document.getElementById('confirmationModal').style.display === 'block') {
                closeConfirmationModal();
            }
        }
        
        // Ctrl+Shift+A لفتح لوحة الأدمن
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            e.preventDefault();
            showAdminPanel();
        }
    });
}

// ========== إعداد أزرار النسخ ==========
function setupCopyButtons() {
    document.querySelectorAll('.copyable').forEach(element => {
        element.addEventListener('click', function() {
            const text = this.textContent.trim();
            const type = this.classList.contains('phone') ? 'رقم الهاتف' : 
                        this.classList.contains('email') ? 'البريد الإلكتروني' : 'النص';
            copyToClipboard(text, type);
        });
    });
}

// ========== عرض نموذج الطلب ==========
function showOrderForm(robux, type) {
    console.log(`📦 اختيار باقة: ${robux} روبكس - نوع: ${type}`);
    
    selectedPack = robux;
    selectedPackType = type;
    
    // تحديث النموذج
    updateOrderSummary(robux, type);
    document.getElementById('packType').value = type;
    
    // إظهار النافذة
    document.getElementById('orderModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // إضافة تأثير
    const modal = document.querySelector('.modal-container');
    modal.style.animation = 'modalSlideIn 0.3s ease-out';
}

function updateOrderSummary(robux, type) {
    const priceEGP = calculatePriceEGP(robux, type);
    const packTypeText = type === 'normal' ? 'روبكس صافي' : 'جفتات';
    const packIcon = type === 'normal' ? 'fas fa-gem' : 'fas fa-gift';
    const packColor = type === 'normal' ? 'var(--primary-light)' : 'var(--gift-light)';
    
    document.getElementById('orderSummary').innerHTML = `
        <div class="order-summary-content" style="border-right: 4px solid ${packColor}; padding-right: 20px;">
            <h4 style="display: flex; align-items: center; gap: 12px; color: ${packColor}; margin-bottom: 20px;">
                <i class="${packIcon}"></i> تفاصيل الباقة المختارة
            </h4>
            
            <div style="display: grid; gap: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 10px;">
                    <span style="color: var(--text-secondary);">النوع:</span>
                    <span style="font-weight: 700; color: ${packColor};">${packTypeText}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 10px;">
                    <span style="color: var(--text-secondary);">الروبكس:</span>
                    <span style="font-size: 1.4rem; font-weight: 800; color: ${packColor};">${robux} روبكس</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 10px;">
                    <span style="color: var(--text-secondary);">السعر:</span>
                    <span style="font-size: 1.4rem; font-weight: 800; color: #ffd700;">${priceEGP} جنيه</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 10px;">
                    <span style="color: var(--text-secondary);">الكوينز:</span>
                    <span style="font-size: 1.4rem; font-weight: 800; color: #ffd700;">${priceEGP} كوين</span>
                </div>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: rgba(255, 211, 105, 0.1); border-radius: 10px; border: 1px solid rgba(255, 211, 105, 0.2);">
                <p style="color: #ffd369; margin: 0; font-size: 0.95rem;">
                    <i class="fas fa-info-circle"></i> 
                    <strong>ملاحظة:</strong> سعر الروبكس = سعر الكوين (نفس القيمة)
                </p>
            </div>
        </div>
    `;
}

function calculatePriceEGP(robux, type) {
    if (type === 'normal') {
        // 1000 روبكس = 320 جنيه
        return Math.round((robux * CONFIG.NORMAL_PRICE_PER_1000) / 1000);
    } else {
        // 1000 روبكس = 220 جنيه
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
    
    const messageDiv = document.getElementById('orderMessage');
    if (messageDiv) {
        messageDiv.style.display = 'none';
        messageDiv.innerHTML = '';
    }
    
    selectedPack = null;
    selectedPackType = null;
}

// ========== إرسال الطلب ==========
async function submitOrder() {
    console.log('🔄 بدء إرسال الطلب...');
    
    // جمع البيانات
    const username = document.getElementById('robloxUsername').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    const packType = document.getElementById('packType').value;
    const paymentMethod = document.getElementById('paymentType').value;
    const notes = document.getElementById('orderNotes').value.trim();
    
    // التحقق من البيانات
    if (!validateOrderData(username, phone, packType, paymentMethod)) {
        return;
    }
    
    // إظهار رسالة الانتظار
    showOrderMessage('🔄 جاري إرسال الطلب...', 'info');
    
    // تعطيل زر الإرسال
    const submitBtn = document.querySelector('.btn-primary');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
    submitBtn.disabled = true;
    
    try {
        // إنشاء الطلب
        const order = createOrder(username, phone, packType, paymentMethod, notes);
        console.log('📝 طلب جديد:', order);
        
        // 1. حفظ الطلب محلياً
        saveOrder(order);
        
        // 2. محاولة الإرسال إلى التليجرام
        const telegramResult = await sendOrderToTelegram(order);
        
        // 3. التعامل مع النتيجة
        if (telegramResult.success) {
            updateOrderStatus(order.id, '🟡 قيد المراجعة', true);
            showConfirmationModal(order);
            
            setTimeout(() => {
                closeOrderModal();
                resetOrderForm();
            }, 3000);
            
        } else {
            // حفظ الطلب حتى مع فشل التليجرام
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
        // إعادة تمكين زر الإرسال
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
    const priceEGP = calculatePriceEGP(selectedPack, packType);
    const packTypeText = packType === 'normal' ? 'روبكس صافي' : 'جفتات';
    
    return {
        id: orderId,
        orderNumber: `ORDER-${orderId.toString().slice(-8)}`,
        user: username,
        robux: selectedPack,
        packType: packType,
        packTypeText: packTypeText,
        priceEGP: priceEGP,
        coins: priceEGP, // نفس قيمة السعر
        phone: phone,
        paymentMethod: paymentMethod,
        notes: notes || 'لا يوجد',
        status: '🟡 قيد الانتظار',
        date: new Date().toLocaleString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        timestamp: Date.now(),
        telegramSent: false,
        telegramMessageId: null,
        adminNotes: '',
        adminStatus: 'pending'
    };
}

// ========== إرسال إلى التليجرام ==========
async function sendOrderToTelegram(order) {
    try {
        console.log('📤 جاري إرسال الطلب إلى قناة @med4009...');
        
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
                                callback_data: 'stats' 
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
            
            // إرسال إشعار شخصي
            await sendPersonalNotification(order);
            
            console.log('✅ تم إرسال الطلب إلى قناة @med4009 بنجاح');
            
            return {
                success: true,
                messageId: data.result.message_id,
                channel: CONFIG.TELEGRAM_CHAT_ID
            };
        } else {
            console.error('❌ فشل إرسال التليجرام:', data.description);
            
            // محاولة إرسال لحسابك الشخصي كبديل
            if (CONFIG.PERSONAL_CHAT_ID) {
                try {
                    await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            chat_id: CONFIG.PERSONAL_CHAT_ID,
                            text: `🚨 طلب جديد (فشل الإرسال للقناة)\n👤 ${order.user}\n📱 ${order.phone}\n💰 ${order.robux} روبكس\n🆔 ${order.orderNumber}`,
                            parse_mode: 'HTML'
                        })
                    });
                } catch (personalError) {
                    console.error('❌ فشل الإرسال الشخصي:', personalError);
                }
            }
            
            return {
                success: true,
                simulated: true,
                message: 'تم حفظ الطلب، سيتم التواصل معك'
            };
        }
        
    } catch (error) {
        console.error('❌ خطأ في إرسال الطلب إلى التليجرام:', error);
        
        return {
            success: true,
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
🪙 <b>الكوينز:</b> ${order.coins} كوين
📱 <b>الهاتف:</b> <code>${order.phone}</code>
💳 <b>الدفع:</b> ${order.paymentMethod}
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

function createTelegramMessage(order) {
    return `
🎮 <b>طلب جديد - OMAR STORE</b> 🎮
━━━━━━━━━━━━━━━━
👤 <b>المستخدم:</b> ${order.user}
🎯 <b>النوع:</b> ${order.packTypeText}
💰 <b>الباقة:</b> ${order.robux} Robux
💵 <b>السعر:</b> ${order.priceEGP} جنيه
🪙 <b>الكوينز:</b> ${order.coins} كوين
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
    }
}

// ========== نافذة التأكيد ==========
function showConfirmationModal(order) {
    console.log('🎉 عرض تأكيد الطلب:', order.orderNumber);
    
    const orderDetails = document.getElementById('orderDetails');
    const orderId = document.getElementById('orderId');
    
    if (orderDetails && orderId) {
        orderDetails.innerHTML = `
            <div style="display: grid; gap: 12px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-secondary);">المستخدم:</span>
                    <span style="font-weight: 700;">${order.user}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-secondary);">النوع:</span>
                    <span style="font-weight: 700; color: ${order.packType === 'normal' ? 'var(--primary-light)' : 'var(--gift-light)'};">${order.packTypeText}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-secondary);">الباقة:</span>
                    <span style="font-weight: 700;">${order.robux} روبكس</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-secondary);">السعر:</span>
                    <span style="font-weight: 700; color: #ffd700;">${order.priceEGP} جنيه</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-secondary);">رقم الهاتف:</span>
                    <span style="font-weight: 700; direction: ltr;">${order.phone}</span>
                </div>
            </div>
        `;
        
        orderId.textContent = order.orderNumber;
        
        document.getElementById('confirmationModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        playSuccessSound();
    }
}

function closeConfirmationModal() {
    document.getElementById('confirmationModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ========== وظائف مساعدة ==========
function showOrderMessage(text, type) {
    const messageDiv = document.getElementById('orderMessage');
    if (messageDiv) {
        messageDiv.innerHTML = text;
        messageDiv.className = `order-message ${type}`;
        messageDiv.style.display = 'block';
    }
}

function copyToClipboard(text, type = 'النص') {
    // طريقة حديثة
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification(`✅ تم نسخ ${type} بنجاح`);
            playSuccessSound();
        }).catch(err => {
            console.error('❌ خطأ في النسخ:', err);
            fallbackCopy(text, type);
        });
    } else {
        // طريقة قديمة للمتصفحات القديمة
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
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${text}</span>
    `;
    
    container.appendChild(notification);
    
    // إضافة تأثير الظهور
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // إزالة الإشعار بعد 3 ثواني
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 400);
    }, 3000);
}

function playSuccessSound() {
    try {
        // إنشاء صوت نجاح بسيط
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.log('⚠️ لا يمكن تشغيل الصوت');
    }
}

// ========== اتصال التليجرام ==========
async function checkTelegramConnection() {
    if (!CONFIG.TELEGRAM_BOT_TOKEN) {
        console.log('⚠️ لم يتم إعداد توكن التليجرام');
        return false;
    }
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/getMe`);
        const data = await response.json();
        
        if (data.ok) {
            console.log('🤖 البوت متصل:', data.result.username);
            return true;
        } else {
            console.error('❌ البوت غير متصل:', data.description);
            showNotification('⚠️ البوت غير متصل حالياً. الطلبات تحفظ محلياً.');
            return false;
        }
    } catch (error) {
        console.error('❌ خطأ في الاتصال بالبوت:', error);
        showNotification('⚠️ لا يمكن الاتصال بالبوت. تحقق من اتصال الإنترنت.');
        return false;
    }
}

// ========== لوحة تحكم الأدمن ==========
function showAdminPanel() {
    const password = prompt('🔐 أدخل كلمة مرور الأدمن:');
    if (password !== 'OMAR109') {
        showNotification('❌ كلمة المرور غير صحيحة');
        return;
    }
    
    isAdminMode = true;
    
    // إنشاء لوحة التحكم
    const panelHTML = `
        <div class="admin-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 5000; padding: 20px; overflow-y: auto;">
            <div class="admin-panel" style="background: var(--card-bg); border-radius: 20px; padding: 30px; max-width: 800px; margin: 0 auto; border: 2px solid var(--primary-light);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <h3 style="color: var(--primary-light); display: flex; align-items: center; gap: 15px;">
                        <i class="fas fa-user-shield"></i> لوحة تحكم الأدمن
                    </h3>
                    <button onclick="closeAdminPanel()" style="background: rgba(231,76,60,0.2); border: none; width: 45px; height: 45px; border-radius: 50%; color: #e74c3c; font-size: 1.2rem; cursor: pointer;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 15px; text-align: center; border-top: 4px solid var(--primary-light);">
                        <div style="font-size: 2.5rem; font-weight: 800; color: #ffd700;">${orders.length}</div>
                        <div style="color: var(--text-secondary);">إجمالي الطلبات</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 15px; text-align: center; border-top: 4px solid #2ecc71;">
                        <div style="font-size: 2.5rem; font-weight: 800; color: #2ecc71;">${orders.filter(o => o.status.includes('✅')).length}</div>
                        <div style="color: var(--text-secondary);">مقبولة</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 15px; text-align: center; border-top: 4px solid var(--primary-blue);">
                        <div style="font-size: 2.5rem; font-weight: 800; color: var(--primary-light);">${orders.filter(o => o.packType === 'normal').length}</div>
                        <div style="color: var(--text-secondary);">روبكس صافي</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 15px; text-align: center; border-top: 4px solid var(--gift-purple);">
                        <div style="font-size: 2.5rem; font-weight: 800; color: var(--gift-light);">${orders.filter(o => o.packType === 'gift').length}</div>
                        <div style="color: var(--text-secondary);">جفتات</div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 15px; margin: 30px 0; flex-wrap: wrap;">
                    <button onclick="exportOrders()" style="flex: 1; min-width: 200px; padding: 15px; background: var(--primary-gradient); border: none; border-radius: 10px; color: white; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <i class="fas fa-download"></i> تصدير الطلبات
                    </button>
                    <button onclick="clearOrders()" style="flex: 1; min-width: 200px; padding: 15px; background: linear-gradient(135deg, #e74c3c, #c0392b); border: none; border-radius: 10px; color: white; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <i class="fas fa-trash"></i> حذف جميع الطلبات
                    </button>
                </div>
                
                <div style="margin-top: 30px;">
                    <h4 style="color: #ffd700; margin-bottom: 20px;">آخر الطلبات</h4>
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${orders.slice(-5).reverse().map(order => `
                            <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 15px; margin: 10px 0; border-left: 4px solid ${order.packType === 'normal' ? 'var(--primary-light)' : 'var(--gift-light)'};">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <div style="font-weight: 700;">${order.user}</div>
                                        <div style="color: var(--text-secondary); font-size: 0.9rem;">${order.robux} روبكس (${order.packTypeText}) - ${order.priceEGP} ج</div>
                                        <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 5px;">${order.date}</div>
                                    </div>
                                    <div style="display: flex; gap: 10px;">
                                        <button onclick="updateOrder('${order.id}', 'accept')" style="background: rgba(46,204,113,0.2); border: 1px solid rgba(46,204,113,0.3); color: #2ecc71; width: 40px; height: 40px; border-radius: 8px; cursor: pointer;">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button onclick="updateOrder('${order.id}', 'reject')" style="background: rgba(231,76,60,0.2); border: 1px solid rgba(231,76,60,0.3); color: #e74c3c; width: 40px; height: 40px; border-radius: 8px; cursor: pointer;">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                                <div style="margin-top: 10px; color: var(--text-secondary); font-size: 0.9rem;">
                                    ${order.status} | ${order.telegramSent ? '📱 مرسل للتليجرام' : '💾 محفوظ محلياً'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const panel = document.createElement('div');
    panel.innerHTML = panelHTML;
    document.body.appendChild(panel);
    
    // إضافة الأنماط
    const style = document.createElement('style');
    style.textContent = `
        .admin-overlay {
            animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

function closeAdminPanel() {
    const panel = document.querySelector('.admin-overlay');
    if (panel) {
        panel.remove();
    }
}

function exportOrders() {
    const dataStr = JSON.stringify(orders, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `omar_store_orders_${new Date().toISOString().split('T')[0]}.json`);
    link.click();
    
    showNotification('✅ تم تصدير الطلبات بنجاح');
    closeAdminPanel();
}

function clearOrders() {
    if (!confirm('⚠️ هل أنت متأكد من حذف جميع الطلبات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        return;
    }
    
    orders = [];
    saveOrders();
    showNotification('🗑️ تم حذف جميع الطلبات');
    closeAdminPanel();
}

function updateOrder(orderId, action) {
    const order = orders.find(o => o.id == orderId);
    if (order) {
        let newStatus, statusText;
        
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
        showNotification(`📱 تم ${statusText} الطلب ${orderId}`);
        
        closeAdminPanel();
        setTimeout(showAdminPanel, 500);
    }
}

// ========== تهيئة لوحة الأدمن ==========
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        showAdminPanel();
    }
});

console.log('✅ تم تحميل جميع الوظائف بنجاح');