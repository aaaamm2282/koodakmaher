/* global CMS */
// Preview pane for news and articles: right-to-left, with the site's fonts and colours.
CMS.registerPreviewStyle('/admin/preview.css');

// Decap 3.17.3's Persian strings have a typo in the list "add" button ("…اضافه کنید}").
// Re-register the Persian locale with that one phrase fixed.
(function fixPersianPhrases() {
  var fa = CMS.getLocale && CMS.getLocale('fa');
  if (!fa || !fa.editor || !fa.editor.editorWidgets || !fa.editor.editorWidgets.list) return;
  var list = fa.editor.editorWidgets.list;
  list.add = 'افزودن %{item}';
  list.addType = 'افزودن %{item}';
  CMS.registerLocale('fa', fa);
})();
