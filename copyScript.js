function f() {
  var a = document.getElementById("myInput");
  a.select();
  a.setSelectionRange(0, 64);
  navigator.clipboard.writeText(a.value);
} 