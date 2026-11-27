// Malay, Mandarin and Tamil. Drafted by an AI assistant: have a native speaker review before release.
// Each line is: English|Malay|Mandarin|Tamil. Anything not listed stays in English.
(() => {
'use strict';
const C = window.CanDo;
const WORDS = `
Who’s using CanDo!?|Siapa guna CanDo!?|谁在使用 CanDo!？|CanDo!-ஐ யார் பயன்படுத்துகிறார்?
Pick your role. You can switch later.|Pilih peranan anda. Boleh tukar kemudian.|选择你的身份，以后可以更换。|உங்கள் பங்கைத் தேர்வு செய்யுங்கள். பிறகு மாற்றலாம்.
Commander|Komander|指挥官|தளபதி
Cadet|Kadet|小队员|இளம் வீரர்
Parent · Mission Control|Ibu bapa · Pusat Misi|家长 · 任务中心|பெற்றோர் · பணி மையம்
Kid · Spaceship Hub|Kanak-kanak · Hab Kapal Angkasa|孩子 · 飞船基地|குழந்தை · விண்கல மையம்
You are offline|Anda di luar talian|你已离线|நீங்கள் இணைப்பில் இல்லை
Try again|Cuba lagi|再试一次|மீண்டும் முயலுங்கள்
CanDo! cannot reach your family server. Check the Wi-Fi and that the server is running.|CanDo! tidak dapat menghubungi pelayan keluarga. Semak Wi-Fi dan pastikan pelayan berjalan.|CanDo! 无法连接家庭服务器。请检查 Wi-Fi 和服务器是否在运行。|CanDo! உங்கள் குடும்பச் சேவையகத்தை அடைய முடியவில்லை. Wi-Fi மற்றும் சேவையகத்தைச் சரிபாருங்கள்.
Parent sign in|Log masuk ibu bapa|家长登录|பெற்றோர் உள்நுழைவு
Create an account or log in to manage your family’s missions.|Cipta akaun atau log masuk untuk urus misi keluarga.|创建账户或登录，管理家庭任务。|குடும்பப் பணிகளை நிர்வகிக்க கணக்கு உருவாக்குங்கள் அல்லது உள்நுழையுங்கள்.
Create Account|Cipta Akaun|创建账户|கணக்கு உருவாக்கு
Log In|Log Masuk|登录|உள்நுழை
Use my HQ PIN|Guna PIN HQ saya|使用我的总部密码|என் HQ PIN-ஐப் பயன்படுத்து
Skip: just use a PIN|Langkau: guna PIN sahaja|跳过：只用密码|தவிர்: PIN மட்டும் பயன்படுத்து
Set up your Parent HQ in a minute.|Sediakan HQ Ibu Bapa dalam seminit.|一分钟设置家长总部。|ஒரு நிமிடத்தில் பெற்றோர் மையத்தை அமையுங்கள்.
Email address|Alamat e-mel|电子邮箱|மின்னஞ்சல் முகவரி
Password|Kata laluan|密码|கடவுச்சொல்
New password|Kata laluan baharu|新密码|புதிய கடவுச்சொல்
Confirm password|Sahkan kata laluan|确认密码|கடவுச்சொல்லை உறுதிசெய்
8+ characters|8+ aksara|至少 8 个字符|8+ எழுத்துகள்
1 number|1 nombor|1 个数字|1 எண்
1 symbol|1 simbol|1 个符号|1 குறியீடு
Your current HQ PIN|PIN HQ semasa|当前总部密码|தற்போதைய HQ PIN
Welcome back!|Selamat kembali!|欢迎回来！|மீண்டும் வருக!
Forgot password?|Lupa kata laluan?|忘记密码？|கடவுச்சொல் மறந்துவிட்டதா?
Enter your email and we’ll send a reset link.|Masukkan e-mel dan kami akan hantar pautan set semula.|输入邮箱，我们会发送重置链接。|மின்னஞ்சலை உள்ளிடுங்கள்; மீட்டமைப்பு இணைப்பு அனுப்புவோம்.
Send Reset Link|Hantar Pautan|发送重置链接|இணைப்பை அனுப்பு
Check your email|Semak e-mel anda|请查看邮箱|மின்னஞ்சலைப் பாருங்கள்
If that address has an account, a reset link is on its way. It expires in 15 minutes.|Jika alamat itu ada akaun, pautan sedang dihantar. Ia tamat dalam 15 minit.|如果该邮箱有账户，重置链接已发出，15 分钟内有效。|அந்த முகவரிக்கு கணக்கு இருந்தால் இணைப்பு வரும். 15 நிமிடங்களில் காலாவதியாகும்.
Back to Log In|Kembali ke Log Masuk|返回登录|உள்நுழைவுக்குத் திரும்பு
Resend link|Hantar semula pautan|重新发送链接|இணைப்பை மீண்டும் அனுப்பு
Make it strong so only you can get in.|Buat yang kukuh supaya hanya anda boleh masuk.|设置强密码，只有你能进入。|நீங்கள் மட்டும் நுழைய வலுவானதாக்குங்கள்.
Save Password|Simpan Kata Laluan|保存密码|கடவுச்சொல்லைச் சேமி
You’re signed in|Anda sudah log masuk|你已登录|நீங்கள் உள்நுழைந்துள்ளீர்கள்
Use your HQ PIN, or choose a new one.|Guna PIN HQ atau pilih yang baharu.|使用总部密码，或设置新密码。|HQ PIN-ஐப் பயன்படுத்துங்கள் அல்லது புதியது தேர்வு செய்யுங்கள்.
Enter my HQ PIN|Masukkan PIN HQ|输入总部密码|HQ PIN-ஐ உள்ளிடு
Set a new PIN|Tetapkan PIN baharu|设置新密码|புதிய PIN அமை
Forgot your PIN?|Lupa PIN anda?|忘记密码锁？|PIN மறந்துவிட்டதா?
Forgot PIN?|Lupa PIN?|忘记密码锁？|PIN மறந்ததா?
We’ll email a one-time reset code to your account.|Kami akan e-mel kod sekali guna.|我们会向你的账户邮箱发送一次性验证码。|ஒருமுறை குறியீட்டை மின்னஞ்சலில் அனுப்புவோம்.
Email me a code|E-mel saya kod|发送验证码|குறியீட்டை அனுப்பு
The code works once and expires in 15 minutes.|Kod sekali guna, tamat dalam 15 minit.|验证码仅能使用一次，15 分钟内有效。|குறியீடு ஒருமுறை மட்டும்; 15 நிமிடங்களில் காலாவதியாகும்.
Enter your code|Masukkan kod|输入验证码|குறியீட்டை உள்ளிடுங்கள்
Check your email for the 6-digit reset code.|Semak e-mel untuk kod 6 digit.|请在邮箱查看 6 位验证码。|6 இலக்க குறியீட்டை மின்னஞ்சலில் பாருங்கள்.
6-digit code|Kod 6 digit|6 位验证码|6 இலக்க குறியீடு
Resend code|Hantar semula kod|重新发送验证码|குறியீட்டை மீண்டும் அனுப்பு
Reset PIN|Set Semula PIN|重置密码锁|PIN மீட்டமை
Create HQ PIN|Cipta PIN HQ|创建总部密码|HQ PIN உருவாக்கு
A 4-digit PIN keeps settings parent-only.|PIN 4 digit memastikan tetapan untuk ibu bapa sahaja.|4 位密码让设置仅限家长使用。|4 இலக்க PIN அமைப்புகளைப் பெற்றோருக்கு மட்டும் ஆக்கும்.
Create PIN|Cipta PIN|创建密码|PIN உருவாக்கு
Confirm your HQ PIN|Sahkan PIN HQ|确认总部密码|HQ PIN-ஐ உறுதிசெய்
Confirm PIN|Sahkan PIN|确认密码|PIN உறுதிசெய்
Enter the same 4 digits again.|Masukkan 4 digit yang sama sekali lagi.|请再次输入相同的 4 位数字。|அதே 4 இலக்கங்களை மீண்டும் உள்ளிடுங்கள்.
Enter your HQ PIN|Masukkan PIN HQ anda|输入总部密码|உங்கள் HQ PIN-ஐ உள்ளிடுங்கள்
Welcome back, Commander.|Selamat kembali, Komander.|欢迎回来，指挥官。|மீண்டும் வருக, தளபதி.
Unlock HQ|Buka HQ|解锁总部|HQ-ஐத் திற
That PIN is not right. Try again.|PIN itu salah. Cuba lagi.|密码不正确，请重试。|PIN தவறு. மீண்டும் முயலுங்கள்.
Zero-pressure routines|Rutin tanpa tekanan|零压力日常|அழுத்தமில்லா வழக்கங்கள்
Pick up to 5 tiny chores per room. No timers, no countdowns, no pressure.|Pilih hingga 5 tugas kecil setiap bilik. Tiada pemasa, tiada tekanan.|每个房间最多选 5 个小任务。没有计时，没有压力。|ஒரு அறைக்கு 5 சிறு வேலைகள் வரை. நேரக்கட்டுப்பாடு இல்லை.
Photo proof|Bukti foto|照片证明|புகைப்படச் சான்று
After the last step, your cadet snaps a photo. You check it before stars are released.|Selepas langkah terakhir, kadet ambil foto. Anda semak sebelum bintang diberi.|完成最后一步后，孩子拍照，你确认后才发放星星。|கடைசிப் படிக்குப் பிறகு குழந்தை புகைப்படம் எடுக்கும். நீங்கள் சரிபார்த்த பின் நட்சத்திரங்கள்.
The Commander’s Key|Kunci Komander|指挥官钥匙|தளபதியின் சாவி
Rewards are claimed with your tap. Only you can burn the ticket.|Ganjaran dituntut dengan sentuhan anda.|奖励由你点击确认，只有你能使用兑换券。|உங்கள் தொடுதலில்தான் பரிசு பெறப்படும்.
You’re ready, Commander|Anda sudah sedia, Komander|你准备好了，指挥官|நீங்கள் தயார், தளபதி
Add your first cadet and link their device in one quick scan.|Tambah kadet pertama dan pautkan peranti dengan satu imbasan.|添加第一位小队员，扫一下即可连接设备。|முதல் குழந்தையைச் சேர்த்து ஒரே ஸ்கேனில் சாதனத்தை இணையுங்கள்.
Add my first cadet|Tambah kadet pertama|添加第一位小队员|முதல் குழந்தையைச் சேர்
Skip|Langkau|跳过|தவிர்
Next|Seterusnya|下一步|அடுத்து
Start|Mula|开始|தொடங்கு
Who is boarding the ship?|Siapa menaiki kapal?|谁要登上飞船？|கப்பலில் ஏறுவது யார்?
Add your child so Popo can cheer them on.|Tambah anak anda supaya Popo boleh menyokongnya.|添加你的孩子，让 Popo 为他加油。|Popo ஊக்குவிக்க உங்கள் குழந்தையைச் சேருங்கள்.
Name|Nama|名字|பெயர்
Age|Umur|年龄|வயது
Choose an avatar|Pilih avatar|选择头像|உருவப்படம் தேர்வு செய்
Add Cadet|Tambah Kadet|添加小队员|குழந்தையைச் சேர்
Add cadet|Tambah kadet|添加小队员|குழந்தையைச் சேர்
Code works once and expires in|Kod sekali guna, tamat dalam|验证码仅用一次，剩余|குறியீடு ஒருமுறை; காலாவதி
seconds.|saat.|秒。|விநாடிகளில்.
New code|Kod baharu|新验证码|புதிய குறியீடு
Do this later|Buat kemudian|稍后再做|பிறகு செய்
This ship is connected to your family HQ.|Kapal ini disambungkan ke HQ keluarga.|这艘飞船已连接到家庭总部。|இந்தக் கப்பல் குடும்ப மையத்துடன் இணைந்தது.
Continue|Teruskan|继续|தொடரவும்
Your family|Keluarga anda|你的家庭|உங்கள் குடும்பம்
Tap a cadet to edit their profile.|Ketik kadet untuk sunting profil.|点击小队员编辑资料。|சுயவிவரத்தைத் திருத்த தொடுங்கள்.
Remove a cadet|Buang kadet|移除小队员|குழந்தையை நீக்கு
Assign a mission|Beri misi|分配任务|பணி ஒதுக்கு
Save profile|Simpan profil|保存资料|சுயவிவரத்தைச் சேமி
Pair a device|Pautkan peranti|配对设备|சாதனத்தை இணை
Show a new QR code|Tunjuk kod QR baharu|显示新二维码|புதிய QR குறியீடு காட்டு
Personalise your cadet’s profile and connected device.|Sesuaikan profil dan peranti kadet.|设置孩子的资料和设备。|குழந்தையின் சுயவிவரத்தைத் தனிப்பயனாக்குங்கள்.
Their stars and history will be deleted.|Bintang dan sejarahnya akan dipadam.|星星和记录将被删除。|நட்சத்திரங்களும் வரலாறும் அழியும்.
Tap to remove|Ketik untuk buang|点击移除|நீக்க தொடுங்கள்
Keep my cadets|Kekalkan kadet|保留小队员|குழந்தைகளை வைத்திரு
Go back, nothing changes|Kembali, tiada perubahan|返回，不做更改|திரும்பு, மாற்றம் இல்லை
Careful!|Hati-hati!|小心！|கவனம்!
Removing a cadet cannot be undone.|Membuang kadet tidak boleh dibatalkan.|移除后无法恢复。|நீக்கியதை மீட்க முடியாது.
Dashboard|Papan Pemuka|主页面板|முகப்புப் பலகை
Home|Utama|首页|முகப்பு
Routines|Rutin|日常安排|வழக்கங்கள்
Inbox|Peti Masuk|收件箱|உள்பெட்டி
Shop|Kedai|商店|கடை
Settings|Tetapan|设置|அமைப்புகள்
Ready|Sedia|就绪|தயார்
● Live|● Sedang berjalan|● 进行中|● நடப்பில்
Paused|Dijeda|已暂停|இடைநிறுத்தம்
steps done|langkah siap|已完成步骤|முடித்த படிகள்
stars today|bintang hari ini|今日星星|இன்றைய நட்சத்திரம்
mission live|misi aktif|进行中任务|செயலில் பணி
Send a gentle heads-up|Hantar peringatan lembut|发送温馨提醒|மென்மையான நினைவூட்டல் அனுப்பு
Create Routine|Cipta Rutin|创建日常|வழக்கம் உருவாக்கு
Pending Approvals|Menunggu Kelulusan|待审批|ஒப்புதல் நிலுவை
No mission running yet|Belum ada misi|还没有进行中的任务|இன்னும் பணி இல்லை
Deploy a mission|Lancarkan misi|发布任务|பணியை அனுப்பு
Send heads-up|Hantar peringatan|发送提醒|நினைவூட்டல் அனுப்பு
Choose a message|Pilih mesej|选择消息|செய்தியைத் தேர்வு செய்
Popo is ready when you are!|Popo sedia bila anda sedia!|你准备好了，Popo 也准备好了！|நீ தயாரானதும் Popo தயார்!
Your room mission is waiting.|Misi bilik anda menunggu.|你的房间任务在等你。|உன் அறைப் பணி காத்திருக்கிறது.
Want to start with one tiny step?|Nak mula dengan satu langkah kecil?|要从一小步开始吗？|ஒரு சிறு படியில் தொடங்கலாமா?
Not now|Bukan sekarang|暂时不要|இப்போது வேண்டாம்
Choose a room|Pilih bilik|选择房间|அறையைத் தேர்வு செய்
Pick the planet for the next mission.|Pilih planet untuk misi seterusnya.|为下一个任务选择星球。|அடுத்த பணிக்கான கோளைத் தேர்வு செய்யுங்கள்.
Change which rooms show|Ubah bilik yang dipaparkan|更改显示的房间|காட்டும் அறைகளை மாற்று
Planet Bedroom|Planet Bilik Tidur|卧室星球|படுக்கையறைக் கோள்
Planet Bathroom|Planet Bilik Air|浴室星球|குளியலறைக் கோள்
Planet Kitchen|Planet Dapur|厨房星球|சமையலறைக் கோள்
Planet Dining|Planet Ruang Makan|餐厅星球|உணவறைக் கோள்
Planet Living Room|Planet Ruang Tamu|客厅星球|வரவேற்பறைக் கோள்
Planet Laundry|Planet Dobi|洗衣星球|சலவைக் கோள்
Planet Entryway|Planet Pintu Masuk|玄关星球|நுழைவாயில் கோள்
Planet Study|Planet Belajar|书房星球|படிப்பறைக் கோள்
Planet School Bag|Planet Beg Sekolah|书包星球|பள்ளிப் பைக் கோள்
Planet Playroom|Planet Bilik Permainan|游戏室星球|விளையாட்டறைக் கோள்
Bedroom|Bilik Tidur|卧室|படுக்கையறை
Bathroom|Bilik Air|浴室|குளியலறை
Kitchen|Dapur|厨房|சமையலறை
Dining Area|Ruang Makan|餐厅|உணவருந்தும் இடம்
Living Room|Ruang Tamu|客厅|வரவேற்பறை
Laundry Area|Ruang Dobi|洗衣区|சலவைப் பகுதி
Entryway|Pintu Masuk|玄关|நுழைவாயில்
Study Area|Ruang Belajar|学习区|படிப்புப் பகுதி
School Bag Area|Ruang Beg Sekolah|书包区|பள்ளிப் பை இடம்
Shared Room|Bilik Kongsi|公共房间|பகிர்வு அறை
No timers|Tiada pemasa|不计时|நேரக்கட்டுப்பாடு இல்லை
Pick up to 5 chores for this mission.|Pilih hingga 5 tugas untuk misi ini.|本次任务最多选 5 项。|இந்தப் பணிக்கு 5 வேலைகள் வரை.
Next: date & cadet|Seterusnya: tarikh & kadet|下一步：日期和队员|அடுத்து: தேதி & குழந்தை
Deploy mission|Lancarkan misi|发布任务|பணியை அனுப்பு
Pick a date and who gets it. No timers, no deadlines.|Pilih tarikh dan penerima. Tiada had masa.|选择日期和执行人。没有时限。|தேதியையும் குழந்தையையும் தேர்வு செய்யுங்கள். காலக்கெடு இல்லை.
Date|Tarikh|日期|தேதி
Today|Hari ini|今天|இன்று
Tomorrow|Esok|明天|நாளை
Pick date|Pilih tarikh|选择日期|தேதி தேர்வு
Assign to|Beri kepada|分配给|ஒதுக்கு
Deploy|Lancarkan|发布|அனுப்பு
Pick date & time|Pilih tarikh & masa|选择日期和时间|தேதி & நேரம்
Pick the start date, time and repeat days.|Pilih tarikh mula, masa dan hari ulangan.|选择开始日期、时间和重复日。|தொடக்கத் தேதி, நேரம், மீள் நாட்களைத் தேர்வு செய்யுங்கள்.
Time|Masa|时间|நேரம்
Repeat on|Ulang pada|重复于|மீண்டும் நாட்கள்
Save schedule|Simpan jadual|保存安排|அட்டவணையைச் சேமி
Every room and who does it.|Setiap bilik dan siapa buat.|每个房间及负责人。|ஒவ்வொரு அறையும் செய்பவரும்.
Add a routine|Tambah rutin|添加日常|வழக்கம் சேர்
Pick a room to start|Pilih bilik untuk mula|选择房间开始|தொடங்க அறை தேர்வு செய்
No routines yet|Belum ada rutin|还没有日常安排|இன்னும் வழக்கம் இல்லை
Create a routine|Cipta rutin|创建日常|வழக்கம் உருவாக்கு
Photo proof waiting for you.|Bukti foto menunggu anda.|有照片等你审核。|புகைப்படச் சான்று காத்திருக்கிறது.
Archive|Arkib|存档|காப்பகம்
Check proofs together|Semak bukti bersama|一起检查照片|சான்றுகளைச் சேர்ந்து பாருங்கள்
Open a photo and verify it with your cadet.|Buka foto dan sahkan bersama kadet.|打开照片，和孩子一起确认。|புகைப்படத்தைத் திறந்து குழந்தையுடன் சரிபாருங்கள்.
All caught up!|Semua selesai!|全部处理完毕！|எல்லாம் முடிந்தது!
Back to dashboard|Kembali ke papan pemuka|返回主页面板|முகப்புக்குத் திரும்பு
Review proof|Semak bukti|审核照片|சான்றைச் சரிபார்
Needs fixing|Perlu dibaiki|需要改进|திருத்தம் தேவை
Verify|Sahkan|确认|சரிபார்
Verified Together|Disahkan Bersama|一起确认|சேர்ந்து சரிபார்த்தது
Look at the whole room|Lihat seluruh bilik|查看整个房间|முழு அறையையும் பாருங்கள்
Compare it with the chores they picked.|Bandingkan dengan tugas yang dipilih.|对照所选任务。|தேர்ந்த வேலைகளுடன் ஒப்பிடுங்கள்.
One retry used|Satu cubaan semula digunakan|已用一次重试|ஒரு மறுமுயற்சி பயன்பட்டது
Back to Inbox|Kembali ke Peti Masuk|返回收件箱|உள்பெட்டிக்குத் திரும்பு
One more try|Satu cubaan lagi|还有一次机会|இன்னும் ஒரு முயற்சி
Perk Shop|Kedai Ganjaran|奖励商店|பரிசுக் கடை
Rewards your cadets can ask for.|Ganjaran yang kadet boleh minta.|孩子可以申请的奖励。|குழந்தைகள் கேட்கக்கூடிய பரிசுகள்.
New perk|Ganjaran baharu|新奖励|புதிய பரிசு
Perk name|Nama ganjaran|奖励名称|பரிசின் பெயர்
🪄 Magic Wand price ideas|🪄 Cadangan harga|🪄 价格建议|🪄 விலைப் பரிந்துரைகள்
1 Day Goal|Sasaran 1 Hari|1 天目标|1 நாள் இலக்கு
3 Day Goal|Sasaran 3 Hari|3 天目标|3 நாள் இலக்கு
1 Week Goal|Sasaran 1 Minggu|1 周目标|1 வார இலக்கு
Star price|Harga bintang|星星价格|நட்சத்திர விலை
Limit per day|Had sehari|每日上限|ஒரு நாள் வரம்பு
Popo stops buys past this.|Popo hentikan belian melebihi had.|超过上限将无法兑换。|இதற்கு மேல் Popo நிறுத்தும்.
Save to Shop|Simpan ke Kedai|保存到商店|கடையில் சேமி
Approval Queue|Barisan Kelulusan|审批列表|ஒப்புதல் வரிசை
Approve|Lulus|批准|ஒப்புக்கொள்
Deny|Tolak|拒绝|மறு
Kind choices, Commander|Pilihan berhemah, Komander|温柔决定，指挥官|அன்பான தேர்வு, தளபதி
Keep your family space safe.|Jaga ruang keluarga anda.|守护你的家庭空间。|குடும்ப இடத்தைப் பாதுகாப்பாக வையுங்கள்.
Manage cadets|Urus kadet|管理小队员|குழந்தைகளை நிர்வகி
Room access|Akses bilik|房间权限|அறை அனுமதி
Choose which rooms show|Pilih bilik dipaparkan|选择显示的房间|காட்டும் அறைகள்
Change Parent PIN|Tukar PIN Ibu Bapa|更改家长密码|பெற்றோர் PIN மாற்று
Keeps settings parent-only|Tetapan untuk ibu bapa sahaja|设置仅限家长|அமைப்புகள் பெற்றோருக்கு மட்டும்
Cadet space|Ruang kadet|小队员空间|குழந்தை இடம்
Sound, motion and reminders|Bunyi, gerakan dan peringatan|声音、动画和提醒|ஒலி, அசைவு, நினைவூட்டல்
Alerts|Makluman|提醒|அறிவிப்புகள்
Choose what pings you|Pilih apa yang memaklumkan anda|选择接收哪些提醒|எது அறிவிக்க வேண்டும்
Privacy|Privasi|隐私|தனியுரிமை
Photos and names|Foto dan nama|照片和名字|புகைப்படங்களும் பெயர்களும்
Reports|Laporan|报告|அறிக்கைகள்
How your cadets did this week|Prestasi kadet minggu ini|孩子本周表现|இந்த வாரச் செயல்பாடு
How your cadets did this week.|Prestasi kadet minggu ini.|孩子本周的表现。|இந்த வாரச் செயல்பாடு.
Language|Bahasa|语言|மொழி
Help|Bantuan|帮助|உதவி
Quick answers|Jawapan pantas|快速解答|விரைவு பதில்கள்
Parent account|Akaun ibu bapa|家长账户|பெற்றோர் கணக்கு
Email, password and PIN reset|E-mel, kata laluan dan set semula PIN|邮箱、密码和重置|மின்னஞ்சல், கடவுச்சொல், PIN மீட்பு
Family Plus|Family Plus|家庭高级版|Family Plus
Plans and pricing|Pelan dan harga|套餐和价格|திட்டங்களும் விலையும்
Log out|Log keluar|退出登录|வெளியேறு
Lock Parent HQ on this device|Kunci HQ pada peranti ini|在此设备锁定总部|இச்சாதனத்தில் HQ பூட்டு
Stay logged in|Kekal log masuk|保持登录|உள்நுழைந்தே இரு
Server address|Alamat pelayan|服务器地址|சேவையக முகவரி
Make the app calm and easy.|Jadikan aplikasi tenang dan mudah.|让应用更平静简单。|செயலியை அமைதியாகவும் எளிதாகவும் ஆக்குங்கள்.
Narration voice|Suara cerita|朗读语音|வாசிப்புக் குரல்
Popo reads each step aloud|Popo baca setiap langkah|Popo 朗读每个步骤|Popo ஒவ்வொரு படியையும் வாசிக்கும்
Calm motion|Gerakan tenang|减少动画|அமைதியான அசைவு
Less animation and sparkle|Kurang animasi dan kilauan|更少动画和闪光|குறைவான அசைவும் மினுக்கமும்
Gentle reminders|Peringatan lembut|温馨提醒|மென்மையான நினைவூட்டல்
A soft nudge before a mission|Peringatan sebelum misi|任务前轻轻提醒|பணிக்கு முன் நினைவூட்டல்
Short missions only|Misi pendek sahaja|仅短任务|குறுகிய பணிகள் மட்டும்
Max 5 steps per room|Maks 5 langkah setiap bilik|每个房间最多 5 步|அறைக்கு அதிகபட்சம் 5 படிகள்
Proof photos|Foto bukti|证明照片|சான்றுப் படங்கள்
When a cadet sends one|Apabila kadet menghantar|孩子发送时|குழந்தை அனுப்பும்போது
SOS pings|Panggilan SOS|求助提醒|SOS அழைப்பு
When a cadet needs help|Apabila kadet perlukan bantuan|孩子需要帮助时|குழந்தைக்கு உதவி தேவைப்படும்போது
Perk requests|Permintaan ganjaran|奖励申请|பரிசுக் கோரிக்கை
When a cadet asks for a perk|Apabila kadet minta ganjaran|孩子申请奖励时|குழந்தை பரிசு கேட்கும்போது
Daily summary|Ringkasan harian|每日总结|தினச் சுருக்கம்
One note each evening|Satu nota setiap petang|每晚一条消息|ஒவ்வொரு மாலையும் ஒரு குறிப்பு
Phone notifications|Pemberitahuan telefon|手机通知|தொலைபேசி அறிவிப்பு
Delete proofs after 24h|Padam bukti selepas 24 jam|24 小时后删除照片|24 மணி நேரத்தில் சான்றை அழி
Hide names on lock screen|Sembunyi nama di skrin kunci|锁屏隐藏名字|பூட்டுத் திரையில் பெயர் மறை
Keep photos and names safe.|Lindungi foto dan nama.|保护照片和名字。|படங்களையும் பெயர்களையும் பாதுகா.
Pick how CanDo! talks to you.|Pilih bahasa CanDo!.|选择 CanDo! 使用的语言。|CanDo! பேசும் மொழியைத் தேர்வு செய்யுங்கள்.
Popo’s recorded voice clips are in English.|Rakaman suara Popo dalam bahasa Inggeris.|Popo 的录音是英语。|Popo பதிவுக் குரல் ஆங்கிலத்தில் உள்ளது.
Quick answers for Commanders.|Jawapan pantas untuk Komander.|给指挥官的快速解答。|தளபதிகளுக்கான விரைவு பதில்கள்.
Notifications|Pemberitahuan|通知|அறிவிப்புகள்
Everything from your cadets.|Semua daripada kadet anda.|孩子们的所有动态。|குழந்தைகளிடமிருந்து அனைத்தும்.
Clear all|Padam semua|全部清除|அனைத்தையும் அழி
Nothing new|Tiada yang baharu|暂无新消息|புதிதாக ஏதுமில்லை
Completion rate|Kadar siap|完成率|நிறைவு விகிதம்
Kind streak|Rentetan baik|连续天数|தொடர் நாட்கள்
A missed day just means a fresh start.|Hari terlepas bermakna permulaan baharu.|错过一天，只是新的开始。|தவறிய நாள் புதிய தொடக்கம்.
Missed days are okay|Hari terlepas tidak mengapa|错过没关系|தவறிய நாட்கள் பரவாயில்லை
Unlock every room|Buka semua bilik|解锁所有房间|எல்லா அறைகளையும் திற
Monthly|Bulanan|按月|மாதாந்திரம்
Yearly|Tahunan|按年|ஆண்டுதோறும்
Maybe later|Mungkin nanti|以后再说|பிறகு பார்க்கலாம்
Subscribe · Family Plus|Langgan · Family Plus|订阅 · 家庭高级版|சந்தா · Family Plus
Save|Simpan|保存|சேமி
Cancel|Batal|取消|ரத்து
Close|Tutup|关闭|மூடு
Got it|Faham|知道了|புரிந்தது
Pause mission|Jeda misi|暂停任务|பணியை இடைநிறுத்து
Resume mission|Sambung misi|继续任务|பணியைத் தொடர்
Cancel mission|Batal misi|取消任务|பணியை ரத்துசெய்
Keep mission|Kekalkan misi|保留任务|பணியை வைத்திரு
Yes, cancel it|Ya, batalkan|是的，取消|ஆம், ரத்துசெய்
Scan to log in|Imbas untuk log masuk|扫码登录|ஸ்கேன் செய்து உள்நுழை
Scan your parent’s QR code to join your family.|Imbas kod QR ibu bapa untuk sertai keluarga.|扫描家长的二维码加入家庭。|குடும்பத்தில் சேர பெற்றோரின் QR-ஐ ஸ்கேன் செய்.
Scan parent’s QR code|Imbas kod QR ibu bapa|扫描家长二维码|பெற்றோர் QR ஸ்கேன் செய்
Grown-up: use this device without scanning|Orang dewasa: guna peranti ini tanpa imbasan|家长：不扫码使用本设备|பெரியவர்: ஸ்கேன் இல்லாமல் பயன்படுத்து
Back to role select|Kembali pilih peranan|返回身份选择|பங்குத் தேர்வுக்குத் திரும்பு
Meet Popo!|Kenali Popo!|认识 Popo！|Popo-வைச் சந்தி!
Your mission buddy. Together we turn chores into adventures.|Rakan misi anda. Kerja rumah jadi pengembaraan.|你的任务伙伴，一起把家务变成冒险。|உன் பணித் தோழன். வேலைகள் சாகசமாகும்.
One step at a time|Satu langkah demi satu|一次一步|ஒரு நேரத்தில் ஒரு படி
Missions show just one tiny task at a time.|Misi tunjuk satu tugas kecil sahaja.|任务一次只显示一件小事。|ஒரு நேரத்தில் ஒரு சிறு வேலை மட்டும்.
Earn stars, get perks|Kumpul bintang, dapat ganjaran|赚星星，换奖励|நட்சத்திரம் சேர், பரிசு பெறு
Finish steps to fill your Star Bank, then shop for rewards.|Siapkan langkah, kumpul bintang, tebus ganjaran.|完成步骤攒星星，再去兑换奖励。|படிகளை முடித்து நட்சத்திரம் சேர், பிறகு பரிசு வாங்கு.
Stuck? Tap Backup|Tersekat? Minta bantuan|卡住了？点求助|சிக்கலா? உதவி கேள்
Popo calls your Commander. You can still get your star.|Popo panggil Komander. Bintang masih boleh didapat.|Popo 会呼叫指挥官，星星仍可获得。|Popo தளபதியை அழைக்கும். நட்சத்திரம் கிடைக்கும்.
Start mission|Mula misi|开始任务|பணியைத் தொடங்கு
Keep going|Teruskan|继续加油|தொடர்ந்து செய்
Retake photo|Ambil semula foto|重新拍照|மீண்டும் படமெடு
Play while you wait|Main sementara menunggu|边玩边等|காத்திருக்கும்போது விளையாடு
Free time|Masa lapang|自由时间|ஓய்வு நேரம்
Your Commander wants one more photo.|Komander mahu satu foto lagi.|指挥官想再看一张照片。|தளபதிக்கு இன்னொரு படம் வேண்டும்.
Your Star Capsule is on its way!|Kapsul Bintang sedang dihantar!|星星胶囊正在路上！|உன் நட்சத்திரப் பெட்டி போகிறது!
No missions right now. Free time!|Tiada misi sekarang. Masa lapang!|现在没有任务，自由时间！|இப்போது பணி இல்லை. ஓய்வு!
Low Battery Mode|Mod Bateri Lemah|低电量模式|குறைந்த ஆற்றல் முறை
Tired? Just 2 small quests.|Penat? Hanya 2 tugas kecil.|累了？只做 2 个小任务。|களைப்பா? 2 சிறு பணிகள் மட்டும்.
🎡 Decide for me!|🎡 Pilihkan untuk saya!|🎡 帮我决定！|🎡 எனக்காகத் தேர்வு செய்!
Mission Wheel|Roda Misi|任务转盘|பணிச் சக்கரம்
Can’t pick? Let Popo spin for you.|Tak boleh pilih? Biar Popo putar.|选不出来？让 Popo 帮你转。|தேர்வு செய்ய முடியவில்லையா? Popo சுழற்றட்டும்.
Spin!|Putar!|转！|சுழற்று!
Let’s do it!|Jom buat!|开始做吧！|செய்வோம்!
I’m ready!|Saya sedia!|我准备好了！|நான் தயார்!
Not yet|Belum lagi|还没有|இன்னும் இல்லை
POPO SAYS|KATA POPO|POPO 说|POPO சொல்கிறது
Show me|Tunjukkan|给我看看|காட்டு
I need help|Saya perlu bantuan|我需要帮助|எனக்கு உதவி வேண்டும்
Mission paused|Misi dijeda|任务已暂停|பணி இடைநிறுத்தம்
Take a break. Your steps are saved.|Rehat dulu. Langkah disimpan.|休息一下，进度已保存。|ஓய்வெடு. படிகள் சேமிக்கப்பட்டன.
Resume|Sambung|继续|தொடர்
Finish early · send photo|Tamat awal · hantar foto|提前结束 · 发送照片|முன்கூட்டி முடி · படம் அனுப்பு
Back to Hub|Kembali ke Hab|返回基地|மையத்துக்குத் திரும்பு
Waiting for Commander|Menunggu Komander|等待指挥官|தளபதிக்காகக் காத்திருப்பு
Skip for now|Langkau dahulu|暂时跳过|இப்போதைக்குத் தவிர்
Back to my step|Kembali ke langkah saya|回到我的步骤|என் படிக்குத் திரும்பு
Skipped for now|Dilangkau dahulu|已暂时跳过|தற்போது தவிர்க்கப்பட்டது
No stress! Half a star is waiting for you. Do this step with a grown-up to get it back.|Tak apa! Separuh bintang menunggu. Buat bersama orang dewasa untuk dapatkannya.|别担心！半颗星在等你，和大人一起完成就能拿回。|கவலை வேண்டாம்! அரை நட்சத்திரம் காத்திருக்கிறது. பெரியவருடன் செய்து பெறு.
Do it with a grown-up|Buat bersama orang dewasa|和大人一起做|பெரியவருடன் செய்
Get a grown-up buddy|Cari rakan dewasa|找个大人帮忙|ஒரு பெரியவரை அழை
Yes, we did it together|Ya, kami buat bersama|是的，我们一起做完了|ஆம், சேர்ந்து செய்தோம்
You won it back!|Anda dapat semula!|你赢回来了！|மீண்டும் வென்றாய்!
Great teamwork! Your half star is back with your stars.|Kerjasama hebat! Separuh bintang kembali.|配合得真棒！半颗星回来了。|அருமையான குழுப்பணி! அரை நட்சத்திரம் திரும்பியது.
Is the room clean?|Bilik dah bersih?|房间干净了吗？|அறை சுத்தமா?
Tell me how it looks. Any answer is okay.|Beritahu keadaannya. Apa jawapan pun boleh.|告诉我看起来怎样，怎么回答都可以。|எப்படி இருக்கிறது? எந்தப் பதிலும் சரி.
Yes|Ya|是|ஆம்
No|Tidak|否|இல்லை
That’s okay!|Tidak mengapa!|没关系！|பரவாயில்லை!
Let’s try again|Jom cuba lagi|再试一次吧|மீண்டும் முயல்வோம்
Back to my steps|Kembali ke langkah|返回我的步骤|என் படிகளுக்குத் திரும்பு
It looks great for today!|Hari ini nampak hebat!|今天看起来很棒！|இன்று அருமையாக இருக்கிறது!
Take my photo|Ambil foto saya|拍照|படமெடு
Let Popo use the camera|Benarkan Popo guna kamera|让 Popo 使用相机|Popo கேமராவைப் பயன்படுத்தட்டும்
Popo needs your camera to take your proof photo.|Popo perlukan kamera untuk foto bukti.|Popo 需要相机拍证明照片。|சான்றுப் படத்துக்கு கேமரா தேவை.
Allow camera|Benarkan kamera|允许使用相机|கேமராவை அனுமதி
Snap your room!|Rakam bilik anda!|拍下你的房间！|அறையைப் படமெடு!
Show the whole room so your Commander can see.|Tunjuk seluruh bilik supaya Komander nampak.|拍下整个房间给指挥官看。|தளபதி பார்க்க முழு அறையையும் காட்டு.
🖼️ Choose a photo|🖼️ Pilih foto|🖼️ 选择照片|🖼️ படத்தைத் தேர்வு செய்
The camera is off|Kamera dimatikan|相机已关闭|கேமரா அணைந்துள்ளது
Back to mission|Kembali ke misi|返回任务|பணிக்குத் திரும்பு
Great photo!|Foto hebat!|照片很棒！|அருமையான படம்!
Your photo is safe. It is on its way to your Commander.|Foto selamat, sedang dihantar kepada Komander.|照片已保存，正在发给指挥官。|படம் பாதுகாப்பு. தளபதிக்குப் போகிறது.
Pack my stars|Kemas bintang saya|打包我的星星|என் நட்சத்திரங்களைக் கட்டு
Star Capsule sent!|Kapsul Bintang dihantar!|星星胶囊已发送！|நட்சத்திரப் பெட்டி அனுப்பப்பட்டது!
Your picture was sent!|Gambar anda dihantar!|照片已发送！|உன் படம் அனுப்பப்பட்டது!
Photo sent|Foto dihantar|照片已发送|படம் அனுப்பப்பட்டது
Commander checks|Komander semak|指挥官检查|தளபதி சரிபார்ப்பு
Stars released|Bintang diberi|发放星星|நட்சத்திரம் விடுவிப்பு
Return to Hub|Kembali ke Hab|返回基地|மையத்துக்குத் திரும்பு
One more photo, please|Satu foto lagi, ya|请再拍一张|இன்னொரு படம், தயவுசெய்து
Photo did not send|Foto tidak dihantar|照片发送失败|படம் அனுப்பப்படவில்லை
Star Shop|Kedai Bintang|星星商店|நட்சத்திரக் கடை
Wardrobe|Almari|衣橱|உடை அலமாரி
Tap a perk you can afford.|Ketik ganjaran yang mampu ditebus.|点击你能兑换的奖励。|உன்னால் வாங்க முடிந்ததைத் தொடு.
🎒 My bag|🎒 Beg saya|🎒 我的背包|🎒 என் பை
Almost there!|Hampir sampai!|快成功了！|கிட்டத்தட்ட!
Keep earning stars|Terus kumpul bintang|继续赚星星|நட்சத்திரம் சேர்
Ask for this perk|Minta ganjaran ini|申请这个奖励|இந்தப் பரிசைக் கேள்
Your stars stay safe while your Commander decides.|Bintang selamat sementara Komander memutuskan.|等指挥官决定时，星星很安全。|தளபதி முடிவு செய்யும் வரை நட்சத்திரம் பாதுகாப்பு.
Great pick!|Pilihan hebat!|选得好！|நல்ல தேர்வு!
Request sent!|Permintaan dihantar!|申请已发送！|கோரிக்கை அனுப்பப்பட்டது!
Request sent|Permintaan dihantar|申请已发送|கோரிக்கை அனுப்பப்பட்டது
Perk in bag|Ganjaran dalam beg|奖励入包|பரிசு பையில்
Back to Star Shop|Kembali ke Kedai|返回星星商店|கடைக்குத் திரும்பு
Inventory|Inventori|背包|சரக்கு
Rewards your Commander approved.|Ganjaran yang diluluskan.|指挥官批准的奖励。|தளபதி ஒப்புக்கொண்ட பரிசுகள்.
Activate|Aktifkan|使用|செயல்படுத்து
Your bag is empty|Beg anda kosong|背包是空的|உன் பை காலி
Go to Star Shop|Pergi ke Kedai|去星星商店|கடைக்குப் போ
Reward active!|Ganjaran aktif!|奖励已启用！|பரிசு செயலில்!
Show Commander!|Tunjuk Komander!|给指挥官看！|தளபதிக்குக் காட்டு!
Commander Acknowledged|Komander Sahkan|指挥官确认|தளபதி ஒப்புதல்
Free Time!|Masa Lapang!|自由时间！|ஓய்வு நேரம்!
All chores done. Popo’s Arcade is open.|Semua tugas siap. Arked Popo dibuka.|任务都完成了，游戏厅开放啦。|எல்லா வேலையும் முடிந்தது. விளையாட்டுக் கூடம் திறந்தது.
Play Bubble Pop|Main Pecah Buih|玩泡泡游戏|குமிழி விளையாடு
No timer. Pop and count!|Tiada pemasa. Pecah dan kira!|不计时，边戳边数！|நேரம் இல்லை. உடைத்து எண்ணு!
Popped|Dipecahkan|已戳破|உடைத்தவை
Popo’s Wardrobe|Almari Popo|Popo 的衣橱|Popo-வின் அலமாரி
🧢 Hats|🧢 Topi|🧢 帽子|🧢 தொப்பிகள்
👓 Gear|👓 Aksesori|👓 装备|👓 அணிகலன்
🪐 Backdrops|🪐 Latar|🪐 背景|🪐 பின்னணி
🏠 Base|🏠 Markas|🏠 基地|🏠 தளம்
Wearing|Dipakai|穿戴中|அணிந்துள்ளது
Yours|Milik anda|已拥有|உன்னுடையது
In your base|Dalam markas|已在基地|உன் தளத்தில்
Save look|Simpan gaya|保存造型|தோற்றத்தைச் சேமி
Check it out!|Cuba lihat!|看看吧！|பார்!
Keep looking|Terus lihat|继续看看|மேலும் பார்
Your stars stay safe until you tap Get it.|Bintang selamat sehingga anda ambil.|点击兑换前星星不会减少。|வாங்கும் வரை நட்சத்திரம் பாதுகாப்பு.
Yes, get it!|Ya, ambil!|好的，兑换！|ஆம், வாங்கு!
Unlocked!|Dibuka!|已解锁！|திறக்கப்பட்டது!
New gear unlocked!|Barang baharu dibuka!|解锁新装备！|புதிய அணிகலன்!
New backdrop unlocked!|Latar baharu dibuka!|解锁新背景！|புதிய பின்னணி!
Wear it now|Pakai sekarang|立即穿上|இப்போது அணி
Back to Wardrobe|Kembali ke Almari|返回衣橱|அலமாரிக்குத் திரும்பு
Look saved!|Gaya disimpan!|造型已保存！|தோற்றம் சேமிக்கப்பட்டது!
Looking great!|Nampak hebat!|真好看！|அருமையாக இருக்கிறது!
Popo will wear this look on your Hub.|Popo akan pakai gaya ini di Hab.|Popo 会在基地穿这身。|Popo இத்தோற்றத்தை அணியும்.
Go to Hub|Pergi ke Hab|前往基地|மையத்துக்குப் போ
Go to my Hub|Pergi ke Hab saya|去我的基地|என் மையத்துக்குப் போ
Keep dressing|Terus berdandan|继续打扮|தொடர்ந்து அலங்கரி
No internet. That is okay!|Tiada internet. Tak mengapa!|没有网络，没关系！|இணையம் இல்லை. பரவாயில்லை!
Popo missed you! All your stars are safe.|Popo rindu anda! Semua bintang selamat.|Popo 想你了！星星都还在。|Popo உன்னைத் தேடியது! நட்சத்திரங்கள் பாதுகாப்பு.
Clear Your Bed|Kemas Katil|清理床铺|படுக்கையைச் சுத்தம் செய்
Fix Your Bedsheet|Betulkan Cadar|整理床单|படுக்கை விரிப்பைச் சரிசெய்
Arrange Your Pillow|Susun Bantal|摆好枕头|தலையணையை அடுக்கு
Spread Your Blanket|Bentang Selimut|铺好被子|போர்வையை விரி
Finish Your Bed|Siapkan Katil|整理完床铺|படுக்கையை முடி
Pick up the toys on your bed.|Kutip mainan di atas katil.|把床上的玩具捡起来。|படுக்கையில் உள்ள பொம்மைகளை எடு.
Put the toys in your toy box.|Letak mainan dalam kotak mainan.|把玩具放进玩具箱。|பொம்மைகளைப் பெட்டியில் வை.
Remove any other objects from your bed.|Alihkan barang lain dari katil.|拿走床上的其他东西。|படுக்கையிலிருந்து மற்ற பொருட்களை அகற்று.
Find the loose bedsheet.|Cari cadar yang longgar.|找到松开的床单。|தளர்ந்த விரிப்பைக் கண்டுபிடி.
Pull the bedsheet straight.|Tarik cadar hingga lurus.|把床单拉直。|விரிப்பை நேராக இழு.
Smooth the bedsheet with your hands.|Ratakan cadar dengan tangan.|用手把床单抚平。|கைகளால் விரிப்பைத் தடவிச் சமமாக்கு.
Pick up your pillow.|Angkat bantal anda.|拿起你的枕头。|தலையணையை எடு.
Fluff your pillow with both hands.|Gebu bantal dengan dua tangan.|用双手拍松枕头。|இரு கைகளால் தலையணையைத் தட்டு.
Place your pillow at the top of your bed.|Letak bantal di kepala katil.|把枕头放在床头。|தலையணையை படுக்கையின் மேல்பகுதியில் வை.
Pick up your blanket.|Angkat selimut.|拿起被子。|போர்வையை எடு.
Open your blanket.|Buka selimut.|展开被子。|போர்வையைப் பிரி.
Spread your blanket over your bed.|Bentang selimut atas katil.|把被子铺在床上。|போர்வையை படுக்கையில் விரி.
Pull the blanket towards the bottom of your bed.|Tarik selimut ke hujung katil.|把被子拉向床尾。|போர்வையைக் கால்பக்கம் இழு.
Straighten the blanket edges.|Luruskan tepi selimut.|把被子边缘整理整齐。|போர்வை ஓரங்களை நேராக்கு.
Look at your neat bed!|Lihat katil yang kemas!|看看你整洁的床！|உன் நேர்த்தியான படுக்கையைப் பார்!
Let’s go! One tiny step. You’ve got this!|Jom! Satu langkah kecil. Anda boleh!|出发！一小步，你可以的！|போவோம்! ஒரு சிறு படி. உன்னால் முடியும்!
Ha, nice one! Just one more to go!|Bagus! Tinggal satu lagi!|真棒！只差一步了！|அருமை! இன்னும் ஒன்றுதான்!
Flush and wave bye|Tekan pam dan lambai|冲水说拜拜|தண்ணீர் விட்டு டாட்டா சொல்
Bubble-wash your hands|Basuh tangan dengan sabun|用泡泡洗手|சோப்பால் கை கழுவு
Dry your hands|Lap tangan|擦干双手|கைகளைத் துடை
Hang the towel|Gantung tuala|挂好毛巾|துண்டைத் தொங்கவிடு
Light off, door closed|Padam lampu, tutup pintu|关灯关门|விளக்கை அணைத்து கதவை மூடு
Rice plate to the sink|Pinggan ke singki|把饭盘放到水槽|தட்டைக் கழுவுதொட்டியில் வை
Cup and spoon to the sink|Cawan dan sudu ke singki|把杯子和勺子放到水槽|கோப்பை, கரண்டியைத் தொட்டியில் வை
Glass to the sink|Gelas ke singki|把玻璃杯放到水槽|குவளையைத் தொட்டியில் வை
Rice bits in the bin|Sisa nasi ke tong|饭粒丢进垃圾桶|சோற்றுத் துகள்களைக் குப்பையில் போடு
Tissue in the bin|Tisu ke tong|纸巾丢进垃圾桶|டிஷ்யூவைக் குப்பையில் போடு
Wipe your table spot|Lap tempat meja anda|擦干净你的桌面|உன் மேசைப் பகுதியைத் துடை
Wipe the table|Lap meja|擦桌子|மேசையைத் துடை
Tuck in your chair|Tolak kerusi masuk|把椅子推好|நாற்காலியை உள்ளே தள்ளு
Spot one thing|Cari satu barang|找出一样东西|ஒரு பொருளைக் கண்டுபிடி
Scoop it up|Kutip ia|把它拿起来|அதை எடு
Take it home|Letak di tempatnya|送它回家|அதன் இடத்தில் வை
Fluff the cushions|Gebu kusyen|拍松靠垫|குஷன்களைத் தட்டு
Straighten the carpet|Luruskan karpet|铺平地毯|கம்பளத்தை நேராக்கு
Spot dirty clothes|Cari baju kotor|找出脏衣服|அழுக்குத் துணியைக் கண்டுபிடி
Walk to the basket|Jalan ke bakul|走到洗衣篮|கூடைக்கு நட
Drop them in|Masukkan ke dalam|放进去|உள்ளே போடு
Hang clothes on the rack|Sidai baju di rak|把衣服挂到架上|துணிகளைத் தாங்கியில் தொங்கவிடு
Shoes on the rack|Kasut di rak|鞋子放鞋架|காலணிகளைத் தட்டில் வை
Slippers in a pair|Susun selipar sepasang|拖鞋摆成一双|செருப்புகளை ஜோடியாக வை
Hang up your coat|Gantung kot|挂好外套|கோட்டைத் தொங்கவிடு
Backpack goes home|Simpan beg galas|书包归位|பையை அதன் இடத்தில் வை
Umbrella in its stand|Payung di tempatnya|雨伞放进伞架|குடையை நிலையில் வை
Pencils in the cup|Pensel dalam cawan|铅笔放进笔筒|பென்சில்களைக் குவளையில் வை
Stack the textbooks|Susun buku teks|叠好课本|பாடநூல்களை அடுக்கு
Papers in the folder|Kertas dalam fail|纸张放进文件夹|தாள்களைக் கோப்பில் வை
Eraser bits in the bin|Sisa pemadam ke tong|橡皮屑丢进垃圾桶|அழிப்பான் துகள்களைக் குப்பையில் போடு
Notebook in the middle|Buku nota di tengah|笔记本放中间|குறிப்பேட்டை நடுவில் வை
Clear out the rubbish|Buang sampah|清掉垃圾|குப்பையை அகற்று
Homework in the folder|Kerja rumah dalam fail|作业放进文件夹|வீட்டுப்பாடத்தைக் கோப்பில் வை
Textbooks in the bag|Buku teks dalam beg|课本放进书包|பாடநூல்களைப் பையில் வை
Pencil case in the bag|Kotak pensel dalam beg|笔袋放进书包|பென்சில் பெட்டியைப் பையில் வை
Fill the water bottle|Isi botol air|装满水瓶|தண்ணீர்ப் புட்டியை நிரப்பு
Spot one toy|Cari satu mainan|找出一个玩具|ஒரு பொம்மையைக் கண்டுபிடி
Tuck it away|Simpan ia|收好它|அதை ஒதுக்கி வை
Roll up the play mat|Gulung tikar permainan|卷起游戏垫|விளையாட்டுப் பாயைச் சுருட்டு
No photos to check right now. Nice work, Commander.|Tiada foto untuk disemak. Syabas, Komander.|暂时没有要审核的照片。干得好，指挥官。|சரிபார்க்கப் படங்கள் இல்லை. நன்று, தளபதி.
English|Inggeris|英语|ஆங்கிலம்
Choose what pings your phone (needs phone notifications).|Pilih apa yang dihantar ke telefon (perlu pemberitahuan telefon).|选择推送到手机的内容（需开启手机通知）。|தொலைபேசிக்கு எது வர வேண்டும் (அறிவிப்பு தேவை).
Set up ntfy|Sediakan ntfy|设置 ntfy|ntfy அமை
Counted from when you verify them|Dikira dari masa anda mengesahkan|从你确认时开始计算|நீங்கள் சரிபார்த்த நேரத்திலிருந்து
Leaves details out of phone alerts|Butiran tidak dipaparkan dalam makluman|手机提醒中不显示详情|அறிவிப்பில் விவரங்கள் இருக்காது
A fresh start is always ready. No streak is lost.|Permulaan baharu sentiasa sedia.|随时可以重新开始。|புதிய தொடக்கம் எப்போதும் தயார்.
Reset Parent PIN|Set semula PIN|重置家长密码|PIN மீட்டமை
Change it in a few taps|Tukar dengan beberapa sentuhan|几步即可更改|சில தொடுதல்களில் மாற்று
Add or remove a cadet|Tambah atau buang kadet|添加或移除小队员|குழந்தையைச் சேர் அல்லது நீக்கு
Manage your family|Urus keluarga|管理家庭|குடும்பத்தை நிர்வகி
Set up perks|Sediakan ganjaran|设置奖励|பரிசுகளை அமை
Choose rewards for stars|Pilih ganjaran untuk bintang|选择星星可换的奖励|நட்சத்திரப் பரிசுகளைத் தேர்வு செய்
Check a photo proof|Semak bukti foto|审核照片|சான்றைச் சரிபார்
Verify a finished mission|Sahkan misi siap|确认已完成的任务|முடித்த பணியை உறுதிசெய்
Still stuck?|Masih tersekat?|还是不明白？|இன்னும் சிக்கலா?
Ask your cadet. They know the app!|Tanya kadet anda!|问问孩子吧，他们很熟！|குழந்தையைக் கேளுங்கள்!
Star Cap|Topi Bintang|星星帽|நட்சத்திரத் தொப்பி
Astro Helmet|Topi Angkasawan|宇航头盔|விண்வெளித் தலைக்கவசம்
Crown|Mahkota|皇冠|கிரீடம்
Moon Beanie|Kupiah Bulan|月亮毛线帽|நிலாத் தொப்பி
Star Shades|Cermin Bintang|星星墨镜|நட்சத்திரக் கண்ணாடி
Space Goggles|Gogal Angkasa|太空护目镜|விண்வெளிக் கண்ணாடி
Hero Cape|Jubah Wira|英雄披风|வீர மேலங்கி
Bow Tie|Tali Leher Kupu-kupu|蝴蝶结|போ டை
Cosmic Glow|Cahaya Kosmik|宇宙光芒|அண்ட ஒளி
Moon Mint|Pudina Bulan|月光薄荷|நிலாப் புதினா
Sunny Planet|Planet Ceria|阳光星球|ஒளிக் கோள்
Pink Nebula|Nebula Merah Jambu|粉色星云|இளஞ்சிவப்பு விண்முகில்
Cosmic Lava Lamp|Lampu Lava Kosmik|宇宙熔岩灯|அண்ட லாவா விளக்கு
Star Galaxy Projector|Projektor Galaksi|星空投影仪|விண்மீன் திரைக்கருவி
Bioluminescent Alien Plant|Pokok Asing Bercahaya|发光外星植物|ஒளிரும் வேற்றுலகச் செடி
Mini Mars Rover Toy|Mainan Rover Marikh|迷你火星车|சிறு செவ்வாய் ஊர்தி
Holographic Disco Orb|Bola Disko Hologram|全息迪斯科球|ஹோலோகிராம் டிஸ்கோ பந்து
Already in your Space Base!|Sudah ada di markas!|已经在你的基地里了！|ஏற்கனவே உன் தளத்தில் உள்ளது!
Almost free time|Hampir masa lapang|快到自由时间了|ஓய்வு நேரம் நெருங்குகிறது
Finish your mission to open Popo’s Arcade.|Siapkan misi untuk buka Arked Popo.|完成任务即可进入游戏厅。|விளையாட்டுக் கூடத்தைத் திறக்கப் பணியை முடி.
Spend your stars in the shop to get your first perk.|Guna bintang di kedai untuk ganjaran pertama.|去商店用星星换第一个奖励。|முதல் பரிசுக்குக் கடையில் நட்சத்திரம் செலவிடு.
`;
const LANG = { ms: 0, zh: 1, ta: 2 };
// Phrases with a changing part: [English pattern, Malay, Mandarin, Tamil]
const PATTERNS = [
  [/^(Planet .+) · Step (\d+) of (\d+)$/, '$1 · Langkah $2/$3', '$1 · 第 $2/$3 步', '$1 · படி $2/$3'],
  [/^Quest (\d+) · (.+)$/, 'Tugas $1 · $2', '任务 $1 · $2', 'பணி $1 · $2'],
  [/^(\d+) steps · once$/, '$1 langkah · sekali', '$1 步 · 一次', '$1 படிகள் · ஒருமுறை'],
  [/^(\d+) of (\d+) days · (\d+) missed$/, '$1/$2 hari · $3 terlepas', '$1/$2 天 · 错过 $3', '$1/$2 நாள் · $3 தவறியது'],
  [/^(\d+)\/(\d+) missions today · ★ ([\d.]+)$/, '$1/$2 misi hari ini · ★ $3', '今日任务 $1/$2 · ★ $3', 'இன்று $1/$2 பணி · ★ $3'],
  [/^Hi, (.+)!$/, 'Hai, $1!', '嗨，$1！', 'வணக்கம், $1!'],
  [/^Step (\d+) of (\d+)$/, 'Langkah $1 daripada $2', '第 $1 步，共 $2 步', 'படி $1 / $2'],
  [/^Quest (\d+) · Step (\d+) of (\d+)$/, 'Tugas $1 · Langkah $2/$3', '任务 $1 · 第 $2/$3 步', 'பணி $1 · படி $2/$3'],
  [/^(\d+) tiny steps\. Popo is with you the whole way!$/, '$1 langkah kecil. Popo temani anda!', '$1 个小步骤，Popo 一直陪着你！', '$1 சிறு படிகள். Popo உடன் இருக்கும்!'],
  [/^(\d+) tiny steps$/, '$1 langkah kecil', '$1 个小步骤', '$1 சிறு படிகள்'],
  [/^(\d+) (?:steps|quests)$/, '$1 langkah', '$1 个步骤', '$1 படிகள்'],
  [/^(\d+) chores?$/, '$1 tugas', '$1 项任务', '$1 வேலைகள்'],
  [/^Need (\d+) more$/, 'Perlu $1 lagi', '还差 $1', 'இன்னும் $1 தேவை'],
  [/^Pair (.+)’s device$/, 'Pautkan peranti $1', '配对 $1 的设备', '$1-ன் சாதனத்தை இணை'],
  [/^(.+) is paired!$/, '$1 sudah dipautkan!', '$1 配对成功！', '$1 இணைக்கப்பட்டது!'],
  [/^Edit (.+)’s profile$/, 'Sunting profil $1', '编辑 $1 的资料', '$1 சுயவிவரத்தைத் திருத்து'],
  [/^(.+) · On Mission$/, '$1 · Dalam Misi', '$1 · 执行任务中', '$1 · பணியில்'],
  [/^To verify · (\d+)$/, 'Untuk disahkan · $1', '待确认 · $1', 'சரிபார்க்க · $1'],
  [/^Pending Approvals \((\d+)\)$/, 'Menunggu Kelulusan ($1)', '待审批 ($1)', 'ஒப்புதல் நிலுவை ($1)'],
  [/^(.+) time!$/, 'Masa $1!', '$1时间到！', '$1 நேரம்!'],
  [/^Get it · (\d+) stars$/, 'Ambil · $1 bintang', '兑换 · $1 星', 'வாங்கு · $1 நட்சத்திரம்'],
  [/^Send to (.+)$/, 'Hantar kepada $1', '发送给 $1', '$1-க்கு அனுப்பு'],
  [/^Welcome back, (.+)!$/, 'Selamat kembali, $1!', '欢迎回来，$1！', 'மீண்டும் வருக, $1!'],
  [/^Stars approved, (.+)$/, 'Bintang diluluskan, $1', '星星已批准，$1', 'நட்சத்திரம் ஒப்புதல், $1'],
  [/^Let’s clean our (.+) together!$/, 'Jom kemas $1 bersama!', '一起打扫$1吧！', 'சேர்ந்து $1-ஐச் சுத்தம் செய்வோம்!']
];
const maps = [new Map(), new Map(), new Map()];
for (const line of WORDS.split('\n')) {
  const [en, ...out] = line.split('|');
  if (en && out.length === 3) out.forEach((t, i) => maps[i].set(en, t));
}

function translate(text) {
  const i = LANG[C.S.data?.prefs.general.language];
  if (i === undefined) return text;
  const core = text.trim();
  if (!core) return text;
  let out = maps[i].get(core);
  if (out === undefined) {
    for (const [re, ...to] of PATTERNS) {
      const m = re.exec(core);
      if (m) { out = to[i].replace(/\$(\d)/g, (_, n) => maps[i].get(m[+n]) ?? maps[i].get(m[+n].replace(/\b\w/g, c => c.toUpperCase())) ?? m[+n]); break; }
    }
  }
  return out === undefined ? text : text.replace(core, () => out);
}
C.translate = translate;

const ATTRS = ['placeholder', 'aria-label'];
function walk(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const out = translate(node.nodeValue);
    if (out !== node.nodeValue) node.nodeValue = out;
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    for (const a of ATTRS) {
      const v = node.getAttribute(a);
      if (v) { const out = translate(v); if (out !== v) node.setAttribute(a, out); }
    }
    node.childNodes.forEach(walk);
  }
}
new MutationObserver(list => {
  if (!(C.S.data?.prefs.general.language in LANG)) return;
  for (const m of list) { if (m.type === 'characterData') walk(m.target); else m.addedNodes.forEach(walk); }
}).observe(document.getElementById('app'), { childList: true, subtree: true, characterData: true });

C.render();
})();
