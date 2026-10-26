/**
 * Web uygulaması giriş noktası.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Nöbet Çizelgesi')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Arayüzden çağrılır: google.script.run.cizelgeUret(girdi)
 */
function cizelgeUret(girdi) {
  return olusturNobetCizelgesi(girdi);
}
