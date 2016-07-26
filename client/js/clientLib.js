const toggleSpeed=200
var optionNum=2;
function toggleList(){
  $("#userList").slideToggle(toggleSpeed);
}
function addOption(){
    $("#options").append("<input type='text' name='option"+optionNum+"' class='long-input'>");
    optionNum++;
}