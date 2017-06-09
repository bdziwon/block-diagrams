var blocksOnBoard = [];
var selectedBlock = undefined;
var arrowStart = undefined;

$(function () {
    $("#blok-startowy").draggable({
        helper: "clone",
        cursor: 'move'
    });
    $("#blok-procesu").draggable({
        helper: "clone",
        cursor: 'move'
    });
    $("#blok-decyzyjny").draggable({
        helper: "clone",
        cursor: 'move'
    });
     $("#blok-wejscia-wyjscia").draggable({
        helper: "clone",
        cursor: 'move'
    });
    $("#container").droppable({
        drop: function (event, ui) {
            var $canvas = $(this);
            if (!ui.draggable.hasClass('canvas-element')) {
                var $canvasElement = ui.draggable.clone();

                //sprawdzanie czy dodawany blok jest dozwolony
                if ($canvasElement.hasClass('disabled-div')) {
                  return;
                }

                $canvasElement.addClass('canvas-element');
                $canvasElement.draggable({
                    containment: '#container'
                });
                $canvas.append($canvasElement);

                var scrollTop     = $(window).scrollTop(),
                    elementOffset = ui.position.top + scrollTop,
                    distance      = (elementOffset - scrollTop);

                $canvasElement.css({
                    left: (ui.position.left),
                    top: elementOffset,
                    position: 'absolute'
                });

                //otwieranie prawego menu po nacisnięciu

                $canvasElement.draggable({
                  start: function() {
                  },
                  drag: function() {
                    redrawArrows($canvasElement);
                    if ($canvasElement.position().top > $(".svg-container").height() - 500) {
                    $(".svg-container").height($(".svg-container").height()+5);
                  }

                  },
                  stop: function() {
                    redrawArrows($canvasElement);
                  }
                });

                $canvasElement.click(function(e){
                  var evt = e || window.event
                  if (evt.ctrlKey) {

                    if (arrowStart == undefined) {
                      arrowStart = $canvasElement;
                    } else {
                      var startBlock  = $.grep(blocksOnBoard, function(e){ return e.div == arrowStart; });
                      var endBlock    = $.grep(blocksOnBoard, function(e){ return e.div == $canvasElement; });
                      var startBlock  = startBlock[0];
                      var endBlock    = endBlock[0];

                      if (startBlock == endBlock) {
                        return;
                      }

                      arrowStart = undefined;

                      //rysowanie strzałki
                      var polyline = document.createElementNS('http://www.w3.org/2000/svg','polyline');
                      var arrow = {startBlock: startBlock, endBlock: endBlock, polyline: polyline};

                      //blok-decyzyjny
                      if ($(startBlock.div).hasClass('blok-decyzyjny')) {
                        if (startBlock.outArrow1 == undefined) {
                          startBlock.outArrow1 = arrow;
                        } else
                        if (startBlock.outArrow2 == undefined) {
                          startBlock.outArrow2 = arrow;
                        } else
                        if (startBlock.outArrow1 != undefined && startBlock.outArrow2 != undefined) {
                          removeArrow(startBlock.outArrow1);
                          removeArrow(startBlock.outArrow2);
                          startBlock.outArrow1 = arrow;
                        }
                      } else
                      //blok zwykly
                      if (startBlock.outArrow1 == undefined) {
                        startBlock.outArrow1 = arrow;
                      } else  {
                        removeArrow(startBlock.outArrow1);
                        startBlock.outArrow1 = arrow;
                      }

                      var points = calculateLinePoints(startBlock, endBlock, arrow);

                      polyline.setAttribute("points",points);
                      polyline.setAttribute("marker-start","url(#circle)")
                      polyline.setAttribute("marker-end","url(#arrow)");

                      endBlock.inArrows.push(arrow);
                      document.getElementById("SVG").appendChild(polyline);
                    }
                    return;
                  }
                  openDivMenu($canvasElement);
                });

                //dodawanie bloku start/koniec
                if ($canvasElement.hasClass('blok-startowy')) {
                  insertStartAndEndBlock($canvasElement);
                }
                if ($canvasElement.hasClass('blok-wejscia-wyjscia')) {
                  insertIOBlock($canvasElement);
                }
                if ($canvasElement.hasClass('blok-decyzyjny')) {
                  insertDecisionBlock($canvasElement);
                }
                if ($canvasElement.hasClass('blok-procesu')) {
                  insertProcessBlock($canvasElement);
                }
            }
        }
    });
});

function removeArrows(div) {

  var startBlock  = $.grep(blocksOnBoard, function(e){ return e.div == div; });
  var startBlock  = startBlock[0];

  console.log(startBlock);

  if (startBlock.outArrow1 != undefined) {
    removeArrow(startBlock.outArrow1);
  }
  if (startBlock.outArrow2 != undefined) {
    removeArrow(startBlock.outArrow2);
  }
  while (startBlock.inArrows.length > 0) {
      removeArrow(startBlock.inArrows[0]);

  }
}

function removeArrow(arrow) {

  for (index = 0; index < blocksOnBoard.length; index++) {
    var div = blocksOnBoard[index];

    if (div.outArrow1 == arrow) {
      console.log("outArrow1 is now undefined");
      blocksOnBoard[index].outArrow1 = undefined;
    }
    if (div.outArrow2 == arrow) {
      console.log("outArrow2 is now undefined");
      blocksOnBoard[index].outArrow2 = undefined;
    }

    for (i = 0; i<div.inArrows.length; i++) {
      if (div.inArrows[i] == arrow) {
        div.inArrows.splice(i,1);
        break;
      }
    }
  }

  arrow.polyline.remove();
}

function redrawArrows(div) {

  var startBlock  = $.grep(blocksOnBoard, function(e){ return e.div == div; });
  var startBlock  = startBlock[0];

  if (startBlock.outArrow1 != undefined) {
    console.log("redrawArrows redrawing out1");
    var points = calculateLinePoints(startBlock.outArrow1.startBlock, startBlock.outArrow1.endBlock, startBlock.outArrow1.startBlock.outArrow1);
    startBlock.outArrow1.polyline.setAttribute("points",points);
    startBlock.outArrow1.polyline.setAttribute("marker-start","url(#circle)")
    startBlock.outArrow1.polyline.setAttribute("marker-end","url(#arrow)");
  }
  if (startBlock.outArrow2 != undefined) {
    console.log("redrawArrows redrawing out2");
    var points = calculateLinePoints(startBlock.outArrow2.startBlock, startBlock.outArrow2.endBlock, startBlock.outArrow2.startBlock.outArrow2);
    startBlock.outArrow2.polyline.setAttribute("points",points);
    startBlock.outArrow2.polyline.setAttribute("marker-start","url(#circle)")
    startBlock.outArrow2.polyline.setAttribute("marker-end","url(#arrow)");
  }

  for (i = 0; i < startBlock.inArrows.length; i++) {
    var points = calculateLinePoints(startBlock.inArrows[i].startBlock, startBlock.inArrows[i].endBlock, startBlock.inArrows[i]);
    startBlock.inArrows[i].polyline.setAttribute("points",points);
    startBlock.inArrows[i].polyline.setAttribute("marker-start","url(#circle)")
    startBlock.inArrows[i].polyline.setAttribute("marker-end","url(#arrow)");
  }

}

function calculateLinePoints(startBlock, endBlock, arrow) {
  var startPos = startBlock.div.offset();
  var endPos   = endBlock.div.offset();
  var x1,y1,x2,y2;
  var arrowSize = 15;
  var offset = 15;

  var bypassDistance = 20;

  if ($(startBlock.div).hasClass('blok-decyzyjny')) {
    if (startBlock.outArrow1 != undefined && startBlock.outArrow2 != undefined && arrow == startBlock.outArrow2) {
      console.log("Blok decyzyjny, alternative start");
      x1 = startPos.left  - offset + startBlock.div.width();
      y1 = startPos.top + startBlock.div.height() / 2;

      x2 = endPos.left  - offset + endBlock.div.width()/2;
      y2 = endPos.top - arrowSize;
    } else {
      x1 = startPos.left  - offset + startBlock.div.width() / 2;
      y1 = startPos.top + startBlock.div.height();

      x2 = endPos.left  - offset + endBlock.div.width()/2;
      y2 = endPos.top - arrowSize;
    }
  } else {

    x1 = startPos.left  - offset + startBlock.div.width() / 2;
    y1 = startPos.top + startBlock.div.height();

    x2 = endPos.left  - offset + endBlock.div.width()/2;
    y2 = endPos.top - arrowSize;

}


  xhalf1 = x1;
  yhalf1 = y1 + bypassDistance;


  if (startPos.left > endPos.left + endBlock.div.width()) {
    xhalf2 = endPos.left + endBlock.div.width() + bypassDistance;
  } else {
    xhalf2 = endPos.left - bypassDistance;
  }

  if (y2 > y1) {
    if ((endPos.left <= startPos.left) && (endPos.left + endBlock.div.width() >= startPos.left)){
      console.log("under 1");
      xhalf2 = endPos.left + endBlock.div.width() / 2 - offset;

    } else

    if ((startPos.left <= endPos.left) && (startPos.left + startBlock.div.width() >= endPos.left)){
      console.log("under 2");
      xhalf2 = endPos.left + endBlock.div.width() / 2 - offset;
    }

  }

  yhalf2 = yhalf1;



  if ((x2 - x1 > bypassDistance) && (y2 > y1)) {
    console.log("true-right");
    yhalf3 = yhalf2;
  } else
  if ((x1 - x2 > bypassDistance) && (y2 > y1)) {
    console.log("true-left");
    yhalf3 = yhalf2;
  } else {
    yhalf3 = endPos.top - bypassDistance;

  }

  if (xhalf2 >= startPos.left && xhalf2 <= startPos.left + startBlock.div.width() && y1 > y2) {
    console.log ("going-top under bypass")
    xhalf2 = startPos.left - bypassDistance;
  }

  xhalf3 = xhalf2;

  xhalf4 = x2;
  yhalf4 = yhalf3;

  return ""+x1+ "," + y1 + " " + xhalf1 + "," + yhalf1 + " " + xhalf2 + "," + yhalf2 + " " + xhalf3 + "," + yhalf3 + " " + xhalf4 + "," + yhalf4 + " " + x2 + "," + y2;
}

function insertProcessBlock($canvasElement) {
  var block = {div: $canvasElement, inArrows: [], outArrow1: undefined, outArrow2: undefined};
  blocksOnBoard.push(block);
}

function insertDecisionBlock($canvasElement) {
  var block = {div: $canvasElement, inArrows: [], outArrow1: undefined, outArrow2: undefined};
  blocksOnBoard.push(block);
}

function insertIOBlock($canvasElement) {
  $canvasElement.html("<p>pusty</p>");
  var block = {div: $canvasElement, inArrows: [], outArrow1: undefined};
  blocksOnBoard.push(block);
}

function insertStartAndEndBlock($canvasElement) {
  var sameBlocks = 0;
  var text;

  //sprawdzanie istniejących bloków start/koniec
  $(blocksOnBoard).each(function(i, block) {
    if (block.div.hasClass('blok-startowy')) {
      if (block.div.text() == "START") {
        sameBlocks++;
        text = block.div.text();
      }
    }
  });

  //jeśli istnieje już blok start to nie dodajemy to nie dodajemy
  if (sameBlocks >= 2 && canvasElement.text() == "START") {
    removeDiv($canvasElement);
    return;
  }

  //jeśli nie ma żadnego bloku to tworzymy blok startu
  if (sameBlocks == 0) {
    $canvasElement.text('START');
    var block = {div: $canvasElement, inArrows: [], outArrow1: undefined};
    blocksOnBoard.push(block);
    return;
  }

  //jeśli jest już blok startu to tworzymy blok końca
  if (text == 'START') {
    $canvasElement.text('KONIEC');
    var block = {div: $canvasElement, inArrows: [], outArrow1: undefined};
    blocksOnBoard.push(block);
  } else {
    //w przeciwnym wypadku blok startu
    $canvasElement.text('START');
    var block = {div: $canvasElement, inArrows: [], outArrow1: undefined};
    blocksOnBoard.push(block);
    return;
  }
}

//usuwa diva
function removeDiv($div) {
  //jeśli usunięto diva start/koniec to odblokowuje dodawanie
  if ($div.hasClass('blok-startowy')) {
    $('#blok-startowy').addClass('enabled-div');
    $('#blok-startowy').removeClass('disabled-div');

  }

  //usuwanie strzałek
  removeArrows($div);

  //usuwanie diva z tablicy
  blocksOnBoard = blocksOnBoard.filter(function(obj) {
    return obj.div !== $div;
  });

  //usuwanie diva z widoku
  $div.remove();
}

function openDivMenu($div) {

  var startBlock  = $.grep(blocksOnBoard, function(e){ return e.div == $div; });
  var startBlock  = startBlock[0];

  console.log(startBlock);

  //przesuwanie diva na szczyt
  $div.parent().append($div);


  //zamykanie poprzednio wybranego diva
  closeDivMenu(selectedBlock);

  //oznaczanie aktualnego diva jako wybrany
  selectedBlock = $div;
  $div.addClass('selectedBlok');

  //poszczególne menu
  if ($div.hasClass('blok-startowy')) {
    openStartAndEndBlockMenu($div);
    return;
  }
  if($div.hasClass('blok-wejscia-wyjscia')) {
    openIOBlockMenu($div);
    return;
  }
  if($div.hasClass('blok-procesu')) {
    openProcessBlockMenu($div);
    return;
  }
  if ($div.hasClass('blok-decyzyjny')){
    openDecisionBlockMenu($div);
    return;
  }

  $('#pressedBlockInfo').html("<p><button class='btn btn-danger' id='removeDivButton' type='button'>Usuń blok</button></p>");
  $(document).ready(function(){
    //usuwanie diva
    $('#removeDivButton').click(function() {
      closeDivMenu($div);
      removeDiv($div);
    });
  });
}

function openDecisionBlockMenu($div) {
  var html    = "";
  var header  = "Blok decyzyjny";
  var description   = "Umożliwia wykonywanie wyrażeń warunkowych"
  var saveButton    = "<button class='btn btn-primary' id='saveDivButton' type='button'>Zapisz</button>";
  var deleteButton  = "<button class='btn btn-danger' id='removeDivButton' type='button'>Usuń blok</button>";
  html = "" +
  "<div class='page-header'>"+
    "<h3>"+header+"</h3>"+
    "<p><i>"+description+"</i></p>"+
    "<h3>"+"Opcje"+"</h3>"+
    "<h4>"+"Wpisz wyrażenie warunkowe (bez if, z nawiasami)"+"</h4>"+
    "<input type='text' class='decisionText form-control'>"+
    "<div class='btn-group'>"+
      ""+saveButton+
      ""+deleteButton+
    "</div>"+
  "</div>"

  $('#pressedBlockInfo').html(html);

  $(document).ready(function(){

    var blockContent = $div.text();
    if (blockContent != undefined) {
        $(".codeTextArea").text(blockContent);
    }
    //usuwanie diva
    $('#removeDivButton').click(function() {
      closeDivMenu($div);
      removeDiv($div);
    });

    $('#saveDivButton').click(function() {
      saveDecisionBlock($div);
    });
  });


}

function openProcessBlockMenu($div) {
  var html    = "";
  var header  = "Blok procesu";
  var description   = "Umożliwia takie działania jak deklaracja zmiennych, przypisywanie, oraz działania arytmetyczno-logiczne"
  var saveButton    = "<button class='btn btn-primary' id='saveDivButton' type='button'>Zapisz</button>";
  var deleteButton  = "<button class='btn btn-danger' id='removeDivButton' type='button'>Usuń blok</button>";
  html = "" +
  "<div class='page-header'>"+
    "<h3>"+header+"</h3>"+
    "<p><i>"+description+"</i></p>"+
    "<h3>"+"Opcje"+"</h3>"+
    "<h4>"+"Wpisz kod"+"</h4>"+
    "<p>"+"Każdą linię zakończ średnikiem"+"</p>"+
    "<textarea class='codeTextArea'></textarea>"+
    "<div class='btn-group'>"+
      ""+saveButton+
      ""+deleteButton+
    "</div>"+
  "</div>"

  $('#pressedBlockInfo').html(html);



  $(document).ready(function(){

    var blockContent = $div.text();
    if (blockContent != undefined) {
        $(".codeTextArea").text(blockContent);
    }
    //usuwanie diva
    $('#removeDivButton').click(function() {
      closeDivMenu($div);
      removeDiv($div);
    });

    $('#saveDivButton').click(function() {
      saveProcessBlock($div);
    });
  });

}

function openIOBlockMenu($div) {
  var html = "";
  var header = "Blok wejścia/wyjścia";
  var description = "Umożliwia m.in. wczytywanie danych od użytkownika.";
  var saveButton = "<button class='btn btn-primary' id='saveDivButton' type='button'>Zapisz</button>";
  var deleteButton = "<button class='btn btn-danger' id='removeDivButton' type='button'>Usuń blok</button>";

  html = "" +
  "<div class='page-header'>"+
    "<h3>"+header+"</h3>"+
    "<p><i>"+description+"</i></p>"+
    "<h3>"+"Opcje"+"</h3>"+
    "<h4>"+"Wypisz/Wczytaj daną"+"</h4>"+
    "<p>"+"Umieść tekst w cudzysłowiu jeśli chcesz go wypisać zamiast zmiennej"+"</p>"+
    "<table id='table' class='table table-hover'>"+
      "<th>"+
        "<tr>"+
          "<th>Nazwa zmiennej</th>"+
          "<th>Działanie</th>"+
        "</tr>"+
      "</th>"+
    "</table>"+
    "<p><button id='addRowButton' type='button' class='btn btn-primary'>"+
      "<span class='glyphicon glyphicon-plus'></span>  Dodaj wiersz"+
    "</button></p>"+
    "<div class='btn-group'>"+
      ""+saveButton+
      ""+deleteButton+
    "</div>"+
  "<div>";

  var blockContent = $div.text().split(";");
  $(document).ready(function(){
    if (blockContent.length > 1) {

      for (var i = 0; i < blockContent.length; i++) {
        var content = blockContent[i].split("(");
        if (content.length >= 2) {
          var value = content[0];
          var varname = content[1].replace(")","");
        } else {
          continue;
        }
        var table = document.getElementById('table');
        addIOTableRow(table,varname,value);
      }
    }
  });

  $('#pressedBlockInfo').html(html);

  $(document).ready(function(){
    //usuwanie diva
    $('#removeDivButton').click(function() {
      closeDivMenu($div);
      removeDiv($div);
    });

    //dodawanie wiersza
    $('#addRowButton').click(function(){
      var table = document.getElementById('table');
      addIOTableRow(table);

    });

    $('#saveDivButton').click(function() {
      saveIOBlock($div);
    });
  });
}


function saveProcessBlock($div) {
  var blockContent = "<div class='bubble'><p><br/>";
  var errors = "";
  blockContent += $(".codeTextArea").val();
  blockContent += "<br/></p></div>";
  var lines = blockContent.split(";").length;
  $div.height(10 + lines * 15);
  $div.html(blockContent);
  redrawArrows($div);
}

function saveDecisionBlock($div) {
  var blockContent = "<div class='bubble decision-rotate'><p><br/>";
  var errors = "";
  var decisionText = $(".decisionText").val();
  blockContent += decisionText;
  blockContent += "<br/></p></div>";
  size = 7 * decisionText.length;

  if (size < 50) {
    size = 50;
  } else {
    size += 25;
  }
  $div.width(size+"px");
  $div.height(size+"px");
  var lineHeight = 0.35 * size + "px";
  console.log(size, lineHeight);
  $div.css('line-height',lineHeight);
  $div.html(blockContent);
  redrawArrows($div);

}


function saveIOBlock($div) {
  var blockContent = "<div class='bubble process-skewx'><p><br/>";
  var errors = "";

  $("tr.move").each(function() {
    $this = $(this);
    var varname = $this.find("input.var").val();
    var value = $this.find("select.value").val();

    if (value == 'wczytaj') {
      if (properVariableName(varname)) {
        blockContent += "wczytaj("+varname+");<br/>";
        return true;
      }
      errors += "Nazwa zmiennej niedozwolona ("+varname+")";
      return true;
    }

    if (value == 'wypisz') {
      //sprawdzanie czy to tekst do wypisania
      if ((varname.charAt(0) == '\"') && (varname.charAt(varname.length-1) == '\"')) {
        blockContent += "wypisz("+varname+");<br/>";
        return true;
      }

      if (properVariableName(varname)) {
        blockContent += "wypisz("+varname+");<br/>";
        return true;
      } else {
        errors += "Nazwa zmiennej niedozwolona ("+varname+")";
      }
    }

  });

  blockContent += "<br/></p></div>";
  var lines = blockContent.split("<br/>").length;
  $div.height(lines * 15);
  $div.width($div.height() + 80);
  $div.html(blockContent);
  console.log(errors);

  redrawArrows($div);

}

function properVariableName(varname) {
  //TODO: sprawdzanie czy nazwa zmiennej jest poprawna
  return true;
}



function openStartAndEndBlockMenu($div) {
  var html = "";
  var header = "";
  var description = "";
  var deleteButton = "";
  if ($div.text() == "START") {
    header = "Blok START";
    description = "Stanowi początek algorytmu, może być tylko jeden";
  } else {
    header = "Blok KONIEC";
    description = "Stanowi koniec algorytmu";
  }
  deleteButton = "<p><button class='btn btn-danger' id='removeDivButton' type='button'>Usuń blok</button></p>";

  html = "" +
  "<div class='page-header'>"+
    "<h3>"+header+"</h3>"+
    "<p><i>"+description+"</i></p>"+
    "<h3>"+"Opcje"+"</h3>"+
    ""+deleteButton+
  "<div>";

  $('#pressedBlockInfo').html(html);

  $(document).ready(function(){
    //usuwanie diva
    $('#removeDivButton').click(function() {
      closeDivMenu($div);
      removeDiv($div);
    });
  });
}

//zamyka menu dla wybranego diva
function closeDivMenu($div) {
  if ($div != undefined) {
    $div.addClass('blok');
    $div.removeClass('selectedBlok');

    $('#pressedBlockInfo').html(
    '<div class="jumbotron">'+
      '<h3>Naciśnij na blok po dodaniu aby zobaczyć więcej informacji</h3>'+
    '</div>'
  );

  }
}


function move(sender) {
  console.log('test');
  var row = $(sender).closest('tr');
  if ($(sender).hasClass('up')) {
    if (row.prev().hasClass('move')) {
      row.prev().before(row);
    }
  } else {
    row.next().after(row);
  }
}

function addIOTableRow(table, varname, value) {
  var row = table.insertRow(table.rows.length);
  row.className += " move";
  var inputCell = row.insertCell(0);
  var optionCell = row.insertCell(1);

  if (varname == undefined) {
    varname = "";
  }
  if (value == undefined) {
    value = 'wypisz';
  }
  inputCell.innerHTML =
  "<div class='form-group'>"+
      "<input type='text' value='"+varname+"' pattern='^[a-zA-Z0-9 ]' class='var form-control'>"+
      "<div class='btn-group'>"+
        "<input type='button' value='W górę' class='btn btn-primary move up' onclick='move(this)'/>"+
        "<input type='button' value='W dół' class='btn btn-primary move down' onclick='move(this)'/>"+
      "</div>"
  "</div>";

  optionCell.innerHTML =
  "<div class='form-group'>"+
      "<select class='form-control value'>"+
        "<option value='wypisz'>wypisz</option>"+
        "<option value='wczytaj'>wczytaj</option>"+
      "</select>"+
      "<input type='button' value='Usuń' class='btn btn-danger move' onclick='deleteRow(this)'/>"+

    "</div>";

    $(optionCell).find("select option[value='"+value+"']").attr("selected","selected");

}

function deleteRow(r) {
    var i = r.parentNode.parentNode.parentNode.rowIndex;
    document.getElementById("table").deleteRow(i);
}
