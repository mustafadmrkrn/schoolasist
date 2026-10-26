/**
 * Web uygulaması giriş noktası.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('MD Education Asist')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * index.html içinde <?!= include('dosya-adi') ?> ile parça dosyalar eklenir.
 */
function include(ad) {
  return HtmlService.createHtmlOutputFromFile(ad).getContent();
}

/**
 * Arayüzden çağrılır: google.script.run.cizelgeUret(girdi)
 */
function cizelgeUret(girdi) {
  return olusturNobetCizelgesi(girdi);
}

/**
 * Arayüzden çağrılır: google.script.run.sinavAnaliz(girdi)
 */
function sinavAnaliz(girdi) {
  return sinavAnaliziYap(girdi);
}
