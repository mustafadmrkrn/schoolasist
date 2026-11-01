/* Dikkat Atölyesi – diller: tr, en, de, ru */
(function(){
"use strict";
const COLOR_KEYS=["kirmizi","mavi","yesil","sari","turuncu","mor","pembe"];
const SHAPE_KEYS=["daire","kare","ucgen","yildiz","kalp","bulut"];

/* ---- Türkçe ---- */
const TR_C={kirmizi:"Kırmızı",mavi:"Mavi",yesil:"Yeşil",sari:"Sarı",turuncu:"Turuncu",mor:"Mor",pembe:"Pembe"};
const TR_S={daire:["daire","daireyi"],kare:["kare","kareyi"],ucgen:["üçgen","üçgeni"],yildiz:["yıldız","yıldızı"],kalp:["kalp","kalbi"],bulut:["bulut","bulutu"]};
/* ---- English ---- */
const EN_C={kirmizi:"red",mavi:"blue",yesil:"green",sari:"yellow",turuncu:"orange",mor:"purple",pembe:"pink"};
const EN_S={daire:["circle","circles"],kare:["square","squares"],ucgen:["triangle","triangles"],yildiz:["star","stars"],kalp:["heart","hearts"],bulut:["cloud","clouds"]};
/* ---- Deutsch: [Wortstamm, unveränderlich?] ---- */
const DE_C={kirmizi:["rot"],mavi:["blau"],yesil:["grün"],sari:["gelb"],turuncu:["orangefarben"],mor:["lila",1],pembe:["rosa",1]};
const DE_S={daire:["Kreis","m","Kreise"],kare:["Quadrat","n","Quadrate"],ucgen:["Dreieck","n","Dreiecke"],yildiz:["Stern","m","Sterne"],kalp:["Herz","n","Herzen"],bulut:["Wolke","f","Wolken"]};
const DE_ART={m:"den",n:"das",f:"die"},DE_END={m:"en",n:"e",f:"e"};
const deAdj=(stem,g,indecl)=>indecl?stem:stem+DE_END[g];
/* ---- Русский: [м.р., вин.ж.р., ср.р., род.м.р.] ---- */
const RU_C={kirmizi:["красный","красную","красное","красного"],mavi:["синий","синюю","синее","синего"],yesil:["зелёный","зелёную","зелёное","зелёного"],sari:["жёлтый","жёлтую","жёлтое","жёлтого"],turuncu:["оранжевый","оранжевую","оранжевое","оранжевого"],mor:["фиолетовый","фиолетовую","фиолетовое","фиолетового"],pembe:["розовый","розовую","розовое","розового"]};
const RU_S={daire:["круг","m","кругов"],kare:["квадрат","m","квадратов"],ucgen:["треугольник","m","треугольников"],yildiz:["звезду","f","звёзд"],kalp:["сердце","n","сердец"],bulut:["облако","n","облаков"]};
const ruAdj=(c,g)=>RU_C[c][g==="m"?0:g==="f"?1:2];
const RU_BIG={m:["самый большой","самый маленький"],f:["самую большую","самую маленькую"],n:["самое большое","самое маленькое"]};
const ruSec=n=>n%10===1&&n%100!==11?"секунду":(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20))?"секунды":"секунд";
const TR_GEN={daire:"dairenin",kare:"karenin",ucgen:"üçgenin",yildiz:"yıldızın",kalp:"kalbin",bulut:"bulutun"};
const TR_POS={above:"üstünde",below:"altında",left:"solunda",right:"sağında"};
const EN_POS={above:"above",below:"below",left:"to the left of",right:"to the right of"};
const DE_POS={above:"über",below:"unter",left:"links neben",right:"rechts neben"};
const RU_INS={kirmizi:"красным",mavi:"синим",yesil:"зелёным",sari:"жёлтым",turuncu:"оранжевым",mor:"фиолетовым",pembe:"розовым"};
const RU_FOBL={kirmizi:"красной",mavi:"синей",yesil:"зелёной",sari:"жёлтой",turuncu:"оранжевой",mor:"фиолетовой",pembe:"розовой"};
const RU_SI={daire:"кругом",kare:"квадратом",ucgen:"треугольником",yildiz:"звездой",kalp:"сердцем",bulut:"облаком"};
const RU_SG={daire:"круга",kare:"квадрата",ucgen:"треугольника",yildiz:"звезды",kalp:"сердца",bulut:"облака"};
function ruPos(rel,c,s){const g=RU_S[s][1];
  if(rel==="above"||rel==="below")return(rel==="above"?"над ":"под ")+(g==="f"?RU_FOBL[c]:RU_INS[c])+" "+RU_SI[s];
  return(rel==="left"?"слева от ":"справа от ")+(g==="f"?RU_FOBL[c]:RU_C[c][3])+" "+RU_SG[s];}
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);

const SKILL_NAMES={
 tr:{BA:"Bütünsel Algı",O:"Organizasyon",EGK:"El-Göz Koordinasyonu",KBA:"Kavramsal Beceri Artışı",EZ:"Eşzamanlılık",KSH:"Kısa Süreli Hafıza",UMY:"Uzaysal-Mekansal Yetenekler",PL:"Planlama",AB:"Aritmetik Beceriler",GA:"Görsel Ayrımlaştırma",IMB:"İnce Motor Becerisi",GH:"Görsel Hafıza",DBG:"Düşünce Becerileri Geliştirme",DSA:"Dikkat Süresi Artışı",GY:"Görsel Yoğunlaşma",YY:"Yorumlama Yargılama",DYK:"Dikkat Yoğunluğu ve Konsantrasyon",S:"Sıralama",DAV:"Dikkatin Ayrıntılara Verilmesi",BEN:"Benzerlikler",PBI:"Parça Bütün İlişkisi",SB:"Sözel Beceriler",B3A:"3 Boyutlu Algı"},
 en:{BA:"Holistic Perception",O:"Organization",EGK:"Hand-Eye Coordination",KBA:"Conceptual Skills",EZ:"Simultaneity",KSH:"Short-Term Memory",UMY:"Spatial Skills",PL:"Planning",AB:"Arithmetic Skills",GA:"Visual Discrimination",IMB:"Fine Motor Skills",GH:"Visual Memory",DBG:"Thinking Skills",DSA:"Attention Span",GY:"Visual Focus",YY:"Reasoning and Judgement",DYK:"Concentration",S:"Sequencing",DAV:"Attention to Detail",BEN:"Similarities",PBI:"Part-Whole Relations",SB:"Verbal Skills",B3A:"3D Perception"},
 de:{BA:"Ganzheitliche Wahrnehmung",O:"Organisation",EGK:"Auge-Hand-Koordination",KBA:"Begriffliches Denken",EZ:"Gleichzeitigkeit",KSH:"Kurzzeitgedächtnis",UMY:"Räumliches Denken",PL:"Planung",AB:"Rechnen",GA:"Visuelle Unterscheidung",IMB:"Feinmotorik",GH:"Visuelles Gedächtnis",DBG:"Denkfähigkeit",DSA:"Aufmerksamkeitsspanne",GY:"Visuelle Konzentration",YY:"Deuten und Urteilen",DYK:"Konzentration",S:"Reihenfolge",DAV:"Blick fürs Detail",BEN:"Gemeinsamkeiten",PBI:"Teil-Ganzes-Beziehung",SB:"Sprachliche Fähigkeiten",B3A:"3D-Wahrnehmung"},
 ru:{BA:"Целостное восприятие",O:"Организация",EGK:"Координация глаз и рук",KBA:"Понятийное мышление",EZ:"Одновременность",KSH:"Кратковременная память",UMY:"Пространственное мышление",PL:"Планирование",AB:"Счёт",GA:"Зрительное различение",IMB:"Мелкая моторика",GH:"Зрительная память",DBG:"Развитие мышления",DSA:"Устойчивость внимания",GY:"Зрительная концентрация",YY:"Анализ и суждение",DYK:"Концентрация внимания",S:"Последовательность",DAV:"Внимание к деталям",BEN:"Сходства",PBI:"Часть и целое",SB:"Речевые навыки",B3A:"Объёмное восприятие"}
};
const SKILL_CODES={
 en:{BA:"H.P",O:"ORG",EGK:"H.E.C",KBA:"C.S",EZ:"SIM",KSH:"S.T.M",UMY:"SPA",PL:"PLAN",AB:"ARI",GA:"V.D",IMB:"F.M",GH:"V.M",DBG:"T.S",DSA:"A.S",GY:"V.F",YY:"R.J",DYK:"CON",S:"SEQ",DAV:"A.D",BEN:"SIMI",PBI:"P.W",SB:"VERB",B3A:"3D"},
 de:{BA:"G.W",O:"ORG",EGK:"A.H.K",KBA:"B.D",EZ:"GLZ",KSH:"K.Z.G",UMY:"R.D",PL:"PLAN",AB:"RECH",GA:"V.U",IMB:"F.M",GH:"V.G",DBG:"DENK",DSA:"A.S",GY:"V.K",YY:"D.U",DYK:"KONZ",S:"REIH",DAV:"DET",BEN:"GEM",PBI:"T.G",SB:"SPR",B3A:"3D"},
 ru:{BA:"Ц.В",O:"ОРГ",EGK:"К.Г.Р",KBA:"П.М",EZ:"ОДН",KSH:"К.П",UMY:"П.Р",PL:"ПЛАН",AB:"СЧЁТ",GA:"З.Р",IMB:"М.М",GH:"З.П",DBG:"Р.М",DSA:"У.В",GY:"З.К",YY:"А.С",DYK:"К.В",S:"ПОСЛ",DAV:"В.Д",BEN:"СХОД",PBI:"Ч.Ц",SB:"РЕЧЬ",B3A:"3D"}
};

const TITLES={
 tr:{position:"Konum",add:"Toplama",diff:"Farkları Say",half:"Yarım Resim",search:"Bul Bakalım",twins:"İkizler",shadow:"Gölgeler",odd:"Farklı Olan",match:"Aynısını Bul",count:"Sayalım",color:"Renkler",size:"Büyük – Küçük",pattern:"Örüntü",memory:"Hafıza",direction:"Yönler",category:"Gruplar",more:"Çok – Az"},
 en:{position:"Where Is It?",add:"Adding",diff:"Spot the Differences",half:"Half Picture",search:"Seek and Find",twins:"Twins",shadow:"Shadows",odd:"Odd One Out",match:"Find the Same",count:"Let's Count",color:"Colors",size:"Big – Small",pattern:"Pattern",memory:"Memory",direction:"Directions",category:"Groups",more:"More – Less"},
 de:{position:"Wo ist es?",add:"Plus",diff:"Unterschiede",half:"Halbes Bild",search:"Such mal!",twins:"Zwillinge",shadow:"Schatten",odd:"Was ist anders?",match:"Finde das Gleiche",count:"Zählen",color:"Farben",size:"Groß – Klein",pattern:"Muster",memory:"Gedächtnis",direction:"Richtungen",category:"Gruppen",more:"Mehr – Weniger"},
 ru:{position:"Где это?",add:"Сложение",diff:"Отличия",half:"Половинка",search:"Найди!",twins:"Близнецы",shadow:"Тени",odd:"Кто отличается?",match:"Найди такой же",count:"Считаем",color:"Цвета",size:"Большой – маленький",pattern:"Узор",memory:"Память",direction:"Направления",category:"Группы",more:"Больше – меньше"}
};

function prompt(lang,p){
  const k=p.k,c=p.c,s=p.s;
  if(lang==="tr")switch(k){
    case"twins":return"Birbirinin tıpatıp aynısı olan ikizler hangisi?";
    case"shadow":return`${TR_C[c]} canavarın gölgesi hangisi? Bul, eşleştir.`;
    case"odd":return"Diğerlerinden farklı olan canavar hangisi?";
    case"match":return"Yukarıdaki canavarın aynısı hangisi?";
    case"count":return`Kaç tane ${TR_S[s][0]} var?`;
    case"color":return p.easy?`${TR_C[c]} renkli ${TR_S[s][1]} bul.`:`${TR_C[c]} ${TR_S[s][1]} bul.`;
    case"size":return`En ${p.big?"büyük":"küçük"} ${TR_S[s][0]} hangisi?`;
    case"pattern":return"Sırayı devam ettir. Soru işaretinin yerine hangisi gelir?";
    case"memory":return`Resme ${p.secs} saniye iyi bak. Sonra hangisini gördüğünü bul!`;
    case"direction":return"Diğerlerinden farklı yöne bakan balık hangisi?";
    case"category":return"Hangisi bu gruba ait değil?";
    case"more":return`Hangi kutuda ${p.few?"en az":"en çok"} ${TR_S[s][0]} var?`;
    case"position":return`${TR_C[c]} ${TR_GEN[s]} ${TR_POS[p.rel]} hangisi var?`;
    case"add":return`İki kutuda toplam kaç tane ${TR_S[s][0]} var?`;
    case"diff":return"İki resim arasında kaç fark var?";
    case"half":return"Bu yarım resmin tamamı hangisi?";
    case"search":return"Farklı olanı bul ve ona dokun!";
  }
  if(lang==="en")switch(k){
    case"twins":return"Which twins are exactly the same?";
    case"shadow":return`Which shadow belongs to the ${EN_C[c]} monster?`;
    case"odd":return"Which monster is different from the others?";
    case"match":return"Which one is the same as the monster at the top?";
    case"count":return`How many ${EN_S[s][1]} are there?`;
    case"color":return`Find the ${EN_C[c]} ${EN_S[s][0]}.`;
    case"size":return`Which is the ${p.big?"biggest":"smallest"} ${EN_S[s][0]}?`;
    case"pattern":return"Continue the pattern. What goes in place of the question mark?";
    case"memory":return`Look at the picture for ${p.secs} seconds. Then find the one you saw!`;
    case"direction":return"Which fish is facing a different way?";
    case"category":return"Which one does not belong to the group?";
    case"more":return`Which box has the ${p.few?"fewest":"most"} ${EN_S[s][1]}?`;
    case"position":return`What is ${EN_POS[p.rel]} the ${EN_C[c]} ${EN_S[s][0]}?`;
    case"add":return`How many ${EN_S[s][1]} are there in both boxes together?`;
    case"diff":return"How many differences are there between the two pictures?";
    case"half":return"Which whole monster does this half belong to?";
    case"search":return"Find the different one and tap it!";
  }
  if(lang==="de"){const S=DE_S[s]||[],g=S[1];switch(k){
    case"twins":return"Welche Zwillinge sind ganz genau gleich?";
    case"shadow":return`Welcher Schatten gehört zum ${DE_C[c][1]?DE_C[c][0]:DE_C[c][0]+"en"} Monster?`;
    case"odd":return"Welches Monster ist anders als die anderen?";
    case"match":return"Welches Monster sieht genauso aus wie das oben?";
    case"count":return`Wie viele ${S[2]} siehst du?`;
    case"color":return`Finde ${DE_ART[g]} ${deAdj(DE_C[c][0],g,DE_C[c][1])} ${S[0]}.`;
    case"size":return`Zeig auf ${DE_ART[g]} ${deAdj(p.big?"größt":"kleinst",g)} ${S[0]}.`;
    case"pattern":return"Setze das Muster fort. Was gehört an die Stelle des Fragezeichens?";
    case"memory":return`Schau dir das Bild ${p.secs} Sekunden lang an. Dann finde, was du gesehen hast!`;
    case"direction":return"Welcher Fisch schaut in eine andere Richtung?";
    case"category":return"Was passt nicht in die Gruppe?";
    case"more":return`In welcher Kiste sind die ${p.few?"wenigsten":"meisten"} ${S[2]}?`;
    case"position":return`Was ist ${DE_POS[p.rel]} ${g==="f"?"der":"dem"} ${DE_C[c][1]?DE_C[c][0]:DE_C[c][0]+"en"} ${S[0]==="Herz"?"Herzen":S[0]}?`;
    case"add":return`Wie viele ${S[2]} sind es in beiden Kisten zusammen?`;
    case"diff":return"Wie viele Unterschiede gibt es zwischen den zwei Bildern?";
    case"half":return"Zu welchem Monster gehört diese Hälfte?";
    case"search":return"Finde das andere Bild und tippe darauf!";
  }}
  if(lang==="ru"){const S=RU_S[s]||[],g=S[1];switch(k){
    case"twins":return"Какие близнецы совсем одинаковые?";
    case"shadow":return`Где тень ${RU_C[c][3]} монстрика?`;
    case"odd":return"Какой монстрик отличается от других?";
    case"match":return"Какой монстрик такой же, как наверху?";
    case"count":return`Сколько здесь ${S[2]}?`;
    case"color":return`Найди ${ruAdj(c,g)} ${S[0]}.`;
    case"size":return`Покажи ${RU_BIG[g][p.big?0:1]} ${S[0]}.`;
    case"pattern":return"Продолжи ряд. Что должно стоять на месте вопроса?";
    case"memory":return`Смотри на картинку ${p.secs} ${ruSec(p.secs)}. Потом найди, что ты видел!`;
    case"direction":return"Какая рыбка смотрит в другую сторону?";
    case"category":return"Что здесь лишнее?";
    case"more":return`В какой коробке ${p.few?"меньше":"больше"} всего ${S[2]}?`;
    case"position":return`Что находится ${ruPos(p.rel,c,s)}?`;
    case"add":return`Сколько всего ${S[2]} в двух коробках?`;
    case"diff":return"Сколько отличий между двумя картинками?";
    case"half":return"Какому монстрику принадлежит эта половинка?";
    case"search":return"Найди картинку, которая отличается, и нажми на неё!";
  }}
  return"";
}
function memSay(lang,secs,showing){
  return{
    tr:showing?`Resme iyi bak ve aklında tut! ${secs} saniye sonra kaybolacak.`:"Şimdi bul bakalım! Az önce hangisini gördün?",
    en:showing?`Look closely and remember it! It will disappear in ${secs} seconds.`:"Now find it! Which one did you just see?",
    de:showing?`Schau genau hin und merk es dir! In ${secs} Sekunden ist es weg.`:"Und jetzt: Welches hast du gerade gesehen?",
    ru:showing?`Смотри внимательно и запоминай! Через ${secs} ${ruSec(secs)} картинка исчезнет.`:"А теперь найди: какого ты сейчас видел?"
  }[lang];
}

const UI={
 tr:{name:"Türkçe",flag:"🇹🇷",voice:"tr-TR",title:["Dikkat","Atölyesi"],mascot:"Pıtırcık",
  hello:(m,done)=>`Merhaba! Ben <b>${m}</b>. ${done?"Harika gidiyorsun!":"Hadi birlikte oynayalım!"}`,
  helloSay:(m,done)=>`Merhaba! Ben ${m}. ${done?"Harika gidiyorsun!":"Hadi birlikte oynayalım!"} Oynamak için sarı düğmeye bas. Her soruyu ben okuyacağım. Anlamazsan hoparlöre dokun, tekrar söylerim.`,
  start:d=>`▶ Oyna: Gün ${d}`,days:"/50 gün",success:"başarı",stars:"/150 yıldız",report:"Beceri Karnesi",legend:"Beceri Simgeleri",map:"Macera Haritası",go:"OYNA!",
  zones:["Çayır Vadisi","Mavi Göl","Mor Orman","Turuncu Kanyon","Yıldız Tepesi"],levels:["Seviye 1 · 3 yaş","Seviye 2 · 3-4 yaş","Seviye 3 · 4 yaş","Seviye 4 · 4-5 yaş","Seviye 5 · 5+ yaş"],
  parent:"👨‍👩‍👧 Ebeveyn ve öğretmen için",parentP:["👆 Çocuk her sayfada cevabı seçer. Doğru/yanlış <b>hemen söylenmez</b>.","🔊 Her soru otomatik okunur. Sarı hoparlöre dokununca tekrar dinlenir.","🏁 10 sayfa bitince <b>Bitir</b>: skor, doğru-yanlış listesi ve becerilere göre sonuç.","🏷️ Sayfanın altındaki simgeler alıştırmanın geliştirdiği beceriler; dokununca adı yazar. Mavi kutu yaklaşık süredir (± 1 dk)."],
  saved:"İlerleme bu cihazda saklanır.",lang:"Dil",day:"Gün",review:"İnceleme",listen:"Tekrar dinle",listenS:"Dinle",next:"İleri ▶",finish:"Bitir 🏁",results:"Sonuçlar 📊",min:"Dakika",
  memLook:"👀 İyi bak, aklında tut!",memShown:"Gösterilen resim",leave:"Çıkmak için ✕'e tekrar dokunun (cevaplar kaybolur)",empty:n=>`${n} sayfa boş! Boş olanlar yanlış sayılır. Bitirmek için tekrar dokunun.`,
  resOf:d=>`Gün ${d} sonuçları`,msgs:["Muhteşem! 🏆","Süpersin! 🎉","Çok iyi! 👏","Güzel deneme! 💪"],correct:"Doğru",wrong:"Yanlış",pages:"📋 Sayfa sayfa",tapReview:"(dokun, incele)",todaySkills:"🧩 Bugün çalışılan beceriler",
  again:"🔁 Tekrar",nextDay:d=>`Gün ${d} ▶`,noData:"Henüz veri yok. Haritadan bir gün tamamlayın! 🗺️",sayRes:(m,c)=>`${m} On sorudan ${c} tanesini doğru yaptın!`,
  repIntro:d=>`<b>${d}</b> gün tamamlandı. Her günün son denemesine göre becerilerdeki doğru oranı.`,reset:"🗑️ İlerlemeyi sıfırla",sure:"Emin misiniz? Tekrar dokunun.",daysDone:"gün",
  legIntro:"Bu simgeler her sayfanın altında yer alır ve alıştırmanın yarar sağladığı alanı gösterir. Mavi kutudaki sayı yaklaşık süredir (± 1 dk).",blank:"Boş",
  noTTS:"Bu cihazda sesli okuma yok",noVoice:"Cihazda Türkçe ses yok. Ayarlar › Erişilebilirlik › Konuşma bölümünden Türkçe ses ekleyin.",chosen:"Türkçe seçildi"},
 en:{name:"English",flag:"🇬🇧",voice:"en-US",title:["Attention","Lab"],mascot:"Pip",
  hello:(m,done)=>`Hello! I'm <b>${m}</b>. ${done?"You're doing great!":"Let's play together!"}`,
  helloSay:(m,done)=>`Hello! I'm ${m}. ${done?"You're doing great!":"Let's play together!"} Press the yellow button to play. I will read every question. If you don't understand, tap the speaker and I'll say it again.`,
  start:d=>`▶ Play Day ${d}`,days:"/50 days",success:"correct",stars:"/150 stars",report:"Skills Report",legend:"Skill Icons",map:"Adventure Map",go:"PLAY!",
  zones:["Meadow Valley","Blue Lake","Purple Forest","Orange Canyon","Star Hill"],levels:["Level 1 · age 3","Level 2 · age 3-4","Level 3 · age 4","Level 4 · age 4-5","Level 5 · age 5+"],
  parent:"👨‍👩‍👧 For parents and teachers",parentP:["👆 The child picks an answer on each page. Right or wrong is <b>not shown right away</b>.","🔊 Every question is read aloud. Tap the yellow speaker to hear it again.","🏁 After 10 pages press <b>Finish</b>: score, right/wrong list and results by skill.","🏷️ The icons at the bottom show the skills each exercise trains; tap one to see its name. The blue box is the approximate time (± 1 min)."],
  saved:"Progress is saved on this device.",lang:"Language",day:"Day",review:"Review",listen:"Listen again",listenS:"Listen",next:"Next ▶",finish:"Finish 🏁",results:"Results 📊",min:"min",
  memLook:"👀 Look closely and remember!",memShown:"The picture shown",leave:"Tap ✕ again to leave (answers will be lost)",empty:n=>`${n} page(s) empty! Empty pages count as wrong. Tap again to finish.`,
  resOf:d=>`Day ${d} results`,msgs:["Amazing! 🏆","Super! 🎉","Very good! 👏","Nice try! 💪"],correct:"Right",wrong:"Wrong",pages:"📋 Page by page",tapReview:"(tap to review)",todaySkills:"🧩 Skills practised today",
  again:"🔁 Again",nextDay:d=>`Day ${d} ▶`,noData:"No data yet. Finish a day on the map! 🗺️",sayRes:(m,c)=>`${m} You got ${c} out of 10 right!`,
  repIntro:d=>`<b>${d}</b> day(s) finished. Share of correct answers per skill, based on the last try of each day.`,reset:"🗑️ Reset progress",sure:"Are you sure? Tap again.",daysDone:"days",
  legIntro:"These icons appear at the bottom of every page and show which areas the exercise helps with. The number in the blue box is the approximate time (± 1 min).",blank:"Empty",
  noTTS:"Speech is not available on this device",noVoice:"No English voice on this device. Add one in Settings › Accessibility › Spoken Content.",chosen:"English selected"},
 de:{name:"Deutsch",flag:"🇩🇪",voice:"de-DE",title:["Fokus-","Werkstatt"],mascot:"Pipo",
  hello:(m,done)=>`Hallo! Ich bin <b>${m}</b>. ${done?"Du machst das super!":"Lass uns zusammen spielen!"}`,
  helloSay:(m,done)=>`Hallo! Ich bin ${m}. ${done?"Du machst das super!":"Lass uns zusammen spielen!"} Drück auf den gelben Knopf, um zu spielen. Ich lese dir jede Frage vor. Wenn du etwas nicht verstehst, tipp auf den Lautsprecher, dann sage ich es noch einmal.`,
  start:d=>`▶ Tag ${d} spielen`,days:"/50 Tage",success:"richtig",stars:"/150 Sterne",report:"Fähigkeiten-Zeugnis",legend:"Symbole",map:"Abenteuerkarte",go:"LOS!",
  zones:["Wiesental","Blauer See","Lila Wald","Orange Schlucht","Sternenhügel"],levels:["Stufe 1 · 3 Jahre","Stufe 2 · 3-4 Jahre","Stufe 3 · 4 Jahre","Stufe 4 · 4-5 Jahre","Stufe 5 · 5+ Jahre"],
  parent:"👨‍👩‍👧 Für Eltern und Lehrkräfte",parentP:["👆 Das Kind wählt auf jeder Seite eine Antwort. Richtig oder falsch wird <b>nicht sofort gezeigt</b>.","🔊 Jede Frage wird vorgelesen. Auf den gelben Lautsprecher tippen, um sie noch einmal zu hören.","🏁 Nach 10 Seiten <b>Fertig</b> drücken: Punktzahl, Liste mit richtig/falsch und Ergebnis nach Fähigkeiten.","🏷️ Die Symbole unten zeigen, welche Fähigkeiten geübt werden; antippen zeigt den Namen. Das blaue Feld ist die ungefähre Zeit (± 1 Min.)."],
  saved:"Der Fortschritt wird auf diesem Gerät gespeichert.",lang:"Sprache",day:"Tag",review:"Rückblick",listen:"Nochmal hören",listenS:"Hören",next:"Weiter ▶",finish:"Fertig 🏁",results:"Ergebnis 📊",min:"Min.",
  memLook:"👀 Schau genau hin und merk es dir!",memShown:"Gezeigtes Bild",leave:"Zum Verlassen nochmal ✕ tippen (Antworten gehen verloren)",empty:n=>`${n} Seite(n) leer! Leere Seiten zählen als falsch. Zum Beenden nochmal tippen.`,
  resOf:d=>`Ergebnis Tag ${d}`,msgs:["Großartig! 🏆","Super! 🎉","Sehr gut! 👏","Gut gemacht! 💪"],correct:"Richtig",wrong:"Falsch",pages:"📋 Seite für Seite",tapReview:"(antippen zum Ansehen)",todaySkills:"🧩 Heute geübte Fähigkeiten",
  again:"🔁 Nochmal",nextDay:d=>`Tag ${d} ▶`,noData:"Noch keine Daten. Spiele einen Tag auf der Karte! 🗺️",sayRes:(m,c)=>`${m} Du hast ${c} von 10 richtig!`,
  repIntro:d=>`<b>${d}</b> Tag(e) geschafft. Anteil richtiger Antworten je Fähigkeit, nach dem letzten Versuch jedes Tages.`,reset:"🗑️ Fortschritt löschen",sure:"Sicher? Nochmal tippen.",daysDone:"Tage",
  legIntro:"Diese Symbole stehen unten auf jeder Seite und zeigen, wobei die Übung hilft. Die Zahl im blauen Feld ist die ungefähre Zeit (± 1 Min.).",blank:"Leer",
  noTTS:"Auf diesem Gerät gibt es keine Sprachausgabe",noVoice:"Keine deutsche Stimme auf diesem Gerät. In Einstellungen › Bedienungshilfen › Gesprochene Inhalte hinzufügen.",chosen:"Deutsch ausgewählt"},
 ru:{name:"Русский",flag:"🇷🇺",voice:"ru-RU",title:["Мастерская","внимания"],mascot:"Пип",
  hello:(m,done)=>`Привет! Я <b>${m}</b>. ${done?"У тебя отлично получается!":"Давай играть вместе!"}`,
  helloSay:(m,done)=>`Привет! Я ${m}. ${done?"У тебя отлично получается!":"Давай играть вместе!"} Чтобы начать, нажми на жёлтую кнопку. Я прочитаю каждый вопрос. Если не понял, нажми на динамик, и я повторю.`,
  start:d=>`▶ Играть: день ${d}`,days:"/50 дней",success:"верно",stars:"/150 звёзд",report:"Табель навыков",legend:"Значки навыков",map:"Карта приключений",go:"ИГРАТЬ!",
  zones:["Луговая долина","Синее озеро","Фиолетовый лес","Оранжевый каньон","Звёздный холм"],levels:["Уровень 1 · 3 года","Уровень 2 · 3–4 года","Уровень 3 · 4 года","Уровень 4 · 4–5 лет","Уровень 5 · 5+ лет"],
  parent:"👨‍👩‍👧 Для родителей и педагогов",parentP:["👆 Ребёнок выбирает ответ на каждой странице. Верно или нет — <b>сразу не показывается</b>.","🔊 Каждый вопрос читается вслух. Нажмите на жёлтый динамик, чтобы послушать ещё раз.","🏁 После 10 страниц нажмите <b>Готово</b>: баллы, список верных и неверных ответов и итоги по навыкам.","🏷️ Значки внизу показывают, какие навыки развивает упражнение; нажмите, чтобы увидеть название. Синий квадрат — примерное время (± 1 мин)."],
  saved:"Прогресс сохраняется на этом устройстве.",lang:"Язык",day:"День",review:"Разбор",listen:"Ещё раз",listenS:"Слушать",next:"Далее ▶",finish:"Готово 🏁",results:"Итоги 📊",min:"мин",
  memLook:"👀 Смотри внимательно и запоминай!",memShown:"Показанная картинка",leave:"Нажмите ✕ ещё раз, чтобы выйти (ответы пропадут)",empty:n=>`Пустых страниц: ${n}. Они считаются неверными. Нажмите ещё раз, чтобы закончить.`,
  resOf:d=>`Итоги: день ${d}`,msgs:["Потрясающе! 🏆","Супер! 🎉","Очень хорошо! 👏","Хорошая попытка! 💪"],correct:"Верно",wrong:"Неверно",pages:"📋 По страницам",tapReview:"(нажми, чтобы посмотреть)",todaySkills:"🧩 Навыки сегодня",
  again:"🔁 Ещё раз",nextDay:d=>`День ${d} ▶`,noData:"Пока нет данных. Пройдите день на карте! 🗺️",sayRes:(m,c)=>`${m} Правильно: ${c} из 10!`,
  repIntro:d=>`Пройдено дней: <b>${d}</b>. Доля верных ответов по каждому навыку (по последней попытке каждого дня).`,reset:"🗑️ Сбросить прогресс",sure:"Вы уверены? Нажмите ещё раз.",daysDone:"дн.",
  legIntro:"Эти значки есть внизу каждой страницы и показывают, что развивает упражнение. Число в синем квадрате — примерное время (± 1 мин).",blank:"Пусто",
  noTTS:"На этом устройстве нет озвучки",noVoice:"На устройстве нет русского голоса. Добавьте его в Настройки › Универсальный доступ › Устный контент.",chosen:"Выбран русский"}
};
window.I18N={UI,TITLES,SKILL_NAMES,SKILL_CODES,prompt,memSay,LANGS:["tr","en","de","ru"]};
})();
