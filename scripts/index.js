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
                    elementOffset = ui.position.top + scrollTop + 40,
                    distance      = (elementOffset - scrollTop);

                var leftPos = ui.position.left - (ui.position.left % 20);

                $canvasElement.css({
                    left: leftPos,
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

                    if (!$canvasElement.hasClass('blok-decyzyjny') && !$canvasElement.hasClass('blok-wejscia-wyjscia')) {
                      var center = $canvasElement.position().left + $canvasElement.width()/2;
                      var leftPosOffset = center % 30;
                      var leftPos =  $canvasElement.position().left - leftPosOffset;

                      $canvasElement.css({
                        left: leftPos
                      });
                    }

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

                      // if (endBlock[0].inArrows.length > 0) {
                      //   if (!startBlock[0].div.hasClass("blok-decyzyjny") && !endBlock[0].div.hasClass("blok-decyzyjny")) {
                      //     return;
                      //   }
                      // }

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

function generateCode() {
  var code = "";
  var currentBlock  = $.grep(blocksOnBoard, function(e){ return (e.div.hasClass('blok-startowy')) && e.div.text() == "START"; });
  var endBlocks  = $.grep(blocksOnBoard, function(e){ return (e.div.hasClass('blok-startowy')) && e.div.text() == "KONIEC"; });
  var curlyBracesToClose = 0;
  var indentationSize = 0;
  var indentationScale = 4;
  var indentation = "";
  var doneBlocks = [];
  var newLine = "\n";
  var endLoop = 0;
  var insideIf = 0;
  var ifStack = new Array();
  currentBlock = currentBlock[0];
  endBlocks = endBlocks[0];


  // sprawdzanie czy istnieje start i koniec
  if(currentBlock == undefined) {
    console.log("brak elementu startowego");
    return;
  }
  // if (endBlocks == undefined) {
  //   console.log("brak elementu końcowego");
  //   return;
  // }

  //Generowanie pustej klasy

  var indentation = getIndentation(indentationSize, indentationScale);
  code += indentation+"public class Main { "+newLine;
  indentationSize += 1;

  indentation = getIndentation(indentationSize, indentationScale);
  code += indentation+"public static void main(String[] args) { "+newLine;
  indentationSize += 1;

  indentation = getIndentation(indentationSize, indentationScale);

  curlyBracesToClose += 2;

  while (currentBlock.outArrow1 != undefined) {
    var previousBlock = currentBlock;
    if (endLoop == 1) {
      endLoop = 0;
      currentBlock = currentBlock.outArrow2.endBlock;
    } else {
      currentBlock = currentBlock.outArrow1.endBlock;
    }

    if ($(currentBlock.div).hasClass('blok-decyzyjny')) {
      console.log("przetwarzanie blok-decyzyjny");
      var blockContent = $(currentBlock.div).text();


      if (insideIf > 0) {
        console.log("-- działanie dla poprzedniego if:");
        if (previousBlock.outArrow1 != currentBlock.inArrows[0] && previousBlock.outArrow2 != currentBlock.inArrows[0]) {
          var block = ifStack.pop();
          if (block != undefined) {
            console.log('---- Otwieram else');
            currentBlock = block;
            endLoop = 1;
            indentationSize--;
            indentation = getIndentation(indentationSize, indentationScale);
            code += indentation + "} else {" + newLine;
            indentationSize++;
            indentation = getIndentation(indentationSize, indentationScale);
            continue;
          } else {
            insideIf--;
            console.log('---- Zamykam else');
            indentationSize--;
            indentation = getIndentation(indentationSize, indentationScale);
            code += indentation + "}" + newLine;
            curlyBracesToClose--;
          }
          console.log("---- brak działania, if był przetworzony.");
        }
      }

      if (blockContent.indexOf("do") !== -1) {
          console.log("-- zamykam pętlę do");
          indentationSize--;
          indentation = getIndentation(indentationSize, indentationScale);
          var re = /\((.*)\)/;
          var inBraces  = blockContent.match(re)[1];
          code += indentation + "} while ("+inBraces+");" + newLine;
          curlyBracesToClose--;

          var arrow1EndBlock = currentBlock.outArrow1.endBlock;
          var block  = $.grep(doneBlocks, function(e){ return (e == arrow1EndBlock)});
          if (block.length != 0) {
            var temp = currentBlock.outArrow1;
            currentBlock.outArrow1 = currentBlock.outArrow2;
            currentBlock.outArrow2 = temp;
            continue;
          }
          continue;
      }
      if (blockContent.indexOf("while") !== -1) {
        console.log("-- while");
          var block  = $.grep(doneBlocks, function(e){ return (e == currentBlock)});
          if (block.length == 0) {
            console.log("---- otwieram while");
            var re = /\((.*)\)/;
            var inBraces  = blockContent.match(re)[1];
            code += indentation + "while("+inBraces+") { " + newLine;
            curlyBracesToClose++;
            indentationSize++;
            indentation = getIndentation(indentationSize, indentationScale);
            doneBlocks.push(currentBlock);
          } else {
            console.log("---- zamykam while");
            indentationSize--;
            indentation = getIndentation(indentationSize, indentationScale);
            code += indentation + "}" + newLine;
            curlyBracesToClose--;
            endLoop = 1;
          }
          continue;
      }

      if (blockContent.indexOf("if") !== -1) {
        var block  = $.grep(doneBlocks, function(e){ return (e == currentBlock)});
        if (block.length != 0) {
          console.log("-- pomijam przetworzony if");
          continue;
        }
        console.log("-- otwieram if");
        insideIf++;
        var re = /\((.*)\)/;
        var inBraces  = blockContent.match(re)[1];
        code += indentation + "if("+inBraces+") { " + newLine;
        curlyBracesToClose++;
        indentationSize++;
        indentation = getIndentation(indentationSize, indentationScale);
        doneBlocks.push(currentBlock);
        ifStack.push(currentBlock);
      }

      if (blockContent.indexOf("for") !== -1) {
          var block  = $.grep(doneBlocks, function(e){ return (e == currentBlock)});
          if (block.length == 0) {
            var re = /\((.*)\)/;
            var inBraces  = blockContent.match(re)[1];
            code += indentation + "for("+inBraces+") { " + newLine;
            curlyBracesToClose++;
            indentationSize++;
            indentation = getIndentation(indentationSize, indentationScale);
            doneBlocks.push(currentBlock);
          } else {
            indentationSize--;
            indentation = getIndentation(indentationSize, indentationScale);
            code += indentation + "}" + newLine;
            curlyBracesToClose--;
            endLoop = 1;
          }

      }
      continue;
    }

    if (currentBlock.inArrows.length > 1) {
      console.log(currentBlock);
      var isDoLoop = 0;
      for (var i = 0; i < currentBlock.inArrows.length; i++) {
        if (currentBlock.inArrows[i].startBlock.div.text().indexOf('do') !== -1) {
          code += indentation + "do {" + newLine;
          curlyBracesToClose++;
          indentationSize++;
          indentation = getIndentation(indentationSize, indentationScale);
          isDoLoop = 1;
        }
      }
      if (isDoLoop == 0) {
        var block = ifStack.pop();
        if (block != undefined) {
          var usedBlock  = $.grep(doneBlocks, function(e){ return (e == currentBlock)});
          if (usedBlock.length == 0) {
            console.log('zamykam if, otwieram else 2')
            doneBlocks.push(currentBlock);
            currentBlock = block;
            endLoop = 1;
            indentationSize--;
            indentation = getIndentation(indentationSize, indentationScale);
            code += indentation + "} else {" + newLine;
            insideIf--;
            indentationSize++;
            indentation = getIndentation(indentationSize, indentationScale);
            continue;
          }
        } else {
          var usedBlock  = $.grep(doneBlocks, function(e){ return (e == currentBlock)});
          if (usedBlock.length != 0) {
            console.log('zamykam else');
            indentationSize--;
            indentation = getIndentation(indentationSize, indentationScale);
            code += indentation + "}" + newLine;
            curlyBracesToClose--;
          }
        }
      }
    }

    if ($(currentBlock.div).hasClass('blok-procesu')) {
      console.log('Przetwarzanie: blok-procesu');
      doneBlocks.push(currentBlock);
      var blockContent = $(currentBlock.div).text();
      var lines = blockContent.split(/\r?\n/);
      for (i = 0; i < lines.length; i++) {
        code += indentation+lines[i] + newLine;
      }
      continue;
    }

    if ($(currentBlock.div).hasClass('blok-startowy')) {
      console.log("przetwarzanie blok-startowy");
      if (currentBlock.div.text() == 'KONIEC') {
        console.log("--KONIEC");
        var block = ifStack.pop();
        if (block != undefined) {
          console.log("----Powrót do if, wstawiam return, otwieram else");
          doneBlocks.push(currentBlock);
          currentBlock = block;
          endLoop = 1;
          code += indentation + "return;" + newLine;
          indentationSize--;
          indentation = getIndentation(indentationSize, indentationScale);
          code += indentation + "} else {" + newLine;
          insideIf--;
          indentationSize++;
          indentation = getIndentation(indentationSize, indentationScale);
          continue;
        }
        console.log("----Wstawiam return, zamykam klamry");
        code += indentation + "return;" + newLine;
        for (var i = 0; i < curlyBracesToClose; i++) {
          indentationSize--;
          indentation = getIndentation(indentationSize, indentationScale);
          code += indentation + "}" + newLine;
        }
      }
    }

    if ($(currentBlock.div).hasClass('blok-wejscia-wyjscia')) {
      console.log('Przetwarzanie: blok-wejscia-wyjscia');
      doneBlocks.push(currentBlock);
      var blockContent = $(currentBlock.div).text();
      var lines = blockContent.split(";");
      for (i = 0; i < lines.length - 1; i++) {
        var re = /\((.*)\)/;
        var inBraces  = lines[i].match(re)[1];
        var words     = lines[i].split('(');
        if (words[0].indexOf('wypisz') !== -1) {
          code += indentation + "System.out.println("+inBraces+");" + newLine;
        } else {
          code += indentation + inBraces + " = (new Scanner(System.in)).next();"+newLine;
        }
      }
      continue;
    }
  }
    console.log(code);

    var generate = document.getElementById("generuj");
    var file = new Blob([code], { type: 'plain/text'});

    if (confirm("Czy chcesz pobrać kod ?") == true){
        generate.href = URL.createObjectURL(file);
        generate.download = 'Main.java';
    }

    else {


    }

}


function getIndentation(indentationSize, indentationScale) {
  var indentation = "";
  for (i=1; i<=indentationSize * indentationScale; i++) {
      indentation += " ";
  }
  return indentation;
}

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



  if ((x2 - x1 > bypassDistance) && (y2 - y1 > bypassDistance)) {
    console.log("true-right");
    yhalf3 = yhalf2;
  } else
  if ((x1 - x2 > bypassDistance) && (y2 - y1 > bypassDistance)) {
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

  var blockContent = "<div class='bubble decision-rotate'><p><br/>";
  var decisionText = "(true)"
  var decisionType = "if";

  if (decisionText.length == 0 ) {
    decisionText == "true";
  }

  if (decisionText.charAt(0) != "(") {
    decisionText = "(" + decisionText;
  }
  if (decisionText.charAt(decisionText.length-1) != ")") {
    decisionText = decisionText + ")";
  }

  var decisionText = decisionType + ": " + decisionText;
  decisionText = escapeHtml(decisionText);

  blockContent += decisionText;
  blockContent += "<br/></p></div>";
  size = (6 * decisionText.length) + 20;

  if (size < 50) {
    size = 50;
  } else {
    size += 25;
  }
  block.div.width(size+"px");
  block.div.height(size+"px");
  var lineHeight = 0.35 * size + "px";
  console.log(size, lineHeight);
  block.div.css('line-height',lineHeight);
  block.div.html(blockContent);
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

    $('#removeArrowsButton').click(function() {
        removeArrows($div);
    });

  });
}

function openDecisionBlockMenu($div) {
  var html                = "";
  var header              = "Blok decyzyjny";
  var description         = "Umożliwia wykonywanie wyrażeń warunkowych"
  var saveButton          = "<button class='btn btn-primary' id='saveDivButton' type='button'>Zapisz</button>";
  var deleteButton        = "<button class='btn btn-danger' id='removeDivButton' type='button'>Usuń blok</button>";
  var removeArrowsButton  = "<button class='btn btn-danger' id='removeArrowsButton' type='button'>Usuń strzałki</button>";


  html = "" +
  "<div class='page-header'>"+
    "<h3>"+header+"</h3>"+
    "<p><i>"+description+"</i></p>"+
    "<h3>"+"Opcje"+"</h3>"+
    "<h4>"+"Wpisz wyrażenie warunkowe (bez if, z nawiasami)"+"</h4>"+
    "<input type='text' class='decisionText form-control'>"+
    "<h4>"+"Wybierz typ wyrażenia:"+"</h4>"+
    "<select class='form-control value'>"+
      "<option value='if'>if</option>"+
      "<option value='for'>for</option>"+
      "<option value='while'>while</option>"+
      "<option value='do'>do</option>"+
    "</select>"+
    "<div class='btn-group'>"+
      ""+saveButton+
    "</div>"+
    "<div class='btn-group'>"+
      ""+deleteButton+
      ""+removeArrowsButton+
    "</div>"+
  "</div>"

  $('#pressedBlockInfo').html(html);

  $(document).ready(function(){

    var blockContent = $div.text();
    if (blockContent != undefined) {
        var words = blockContent.split(" ");
        $(".decisionText").val(words[1]);
        var value = words[0];
        value = value.substring(0, value.length - 1);
        $(".value option[value='"+value+"']").attr("selected","selected");

    }
    //usuwanie diva
    $('#removeDivButton').click(function() {
      closeDivMenu($div);
      removeDiv($div);
    });

    $('#removeArrowsButton').click(function() {
        removeArrows($div);
    });

    $('#saveDivButton').click(function() {
      saveDecisionBlock($div);
    });
  });


}

function openProcessBlockMenu($div) {
  var html                = "";
  var header              = "Blok procesu";
  var description         = "Umożliwia takie działania jak deklaracja zmiennych, przypisywanie, oraz działania arytmetyczno-logiczne"
  var saveButton          = "<button class='btn btn-primary' id='saveDivButton' type='button'>Zapisz</button>";
  var deleteButton        = "<button class='btn btn-danger' id='removeDivButton' type='button'>Usuń blok</button>";
  var removeArrowsButton  = "<button class='btn btn-danger' id='removeArrowsButton' type='button'>Usuń strzałki</button>";

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
    "</div>"+
    "<br />"+
    "<div class='btn-group'>"+
      ""+deleteButton+
      ""+removeArrowsButton+
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

    $('#removeArrowsButton').click(function() {
        removeArrows($div);
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
  var removeArrowsButton  = "<button class='btn btn-danger' id='removeArrowsButton' type='button'>Usuń strzałki</button>";


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
    "</div>"+
    "<div class='btn-group'>"+
      ""+deleteButton+
      ""+removeArrowsButton+
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

    $('#removeArrowsButton').click(function() {
        removeArrows($div);
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

function getTextWidth(text, font) {
    // re-use canvas object for better performance
    var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    var context = canvas.getContext("2d");
    context.font = font;
    var metrics = context.measureText(text);
    return metrics.width;
}

function saveProcessBlock($div) {
  var codeContent = $(".codeTextArea").val();
  var blockContent = "<div class='bubble'><p><br/>";
  var errors = "";
  blockContent += $(".codeTextArea").val();
  blockContent += "<br/></p></div>";
  var lines = blockContent.split(";").length;
  var blockContentLines = codeContent.split(";")
  console.log(blockContentLines);
  if (blockContentLines.length > 1) {
    var longestRow = blockContentLines[0];
    for(i = 1; i<blockContentLines.length; i++) {
      if (blockContentLines[i].length > longestRow.length) {
        longestRow = blockContentLines[i];
      }
    }
  }

  $div.height(10 + lines * 15);
  $div.css("font","10pt arial");
  var width = getTextWidth(longestRow,"10pt arial");
  $div.width(20 + width);
  $div.html(blockContent);
  redrawArrows($div);
}

function saveDecisionBlock($div) {
  var blockContent = "<div class='bubble decision-rotate'><p><br/>";
  var errors = "";
  var decisionText = $(".decisionText").val();
  var decisionType = $(".value").val();

  if (decisionText.length == 0 ) {
    decisionText == "true";
  }

  if (decisionText.charAt(0) != "(") {
    decisionText = "(" + decisionText;
  }
  if (decisionText.charAt(decisionText.length-1) != ")") {
    decisionText = decisionText + ")";
  }

  var decisionText = decisionType + ": " + decisionText;
  decisionText = escapeHtml(decisionText);

  blockContent += decisionText;
  blockContent += "<br/></p></div>";
  console.log(blockContent);

  $div.css("font","10pt arial");
  var width = getTextWidth(decisionText,"10pt arial");
  $div.width(20 +  width + "px");
  $div.height(20 + width + "px");

  var lineHeight = 0.35 * (width + 20) + "px";
  $div.css('line-height',lineHeight);
  $div.html(blockContent);
  redrawArrows($div);

}

function escapeHtml(text) {
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}


function saveIOBlock($div) {
  var blockContent = "<div class='bubble process-skewx'><p><br/>";
  var errors = "";

  var longestVarname = "";

  $("tr.move").each(function() {
    $this = $(this);
    var varname = $this.find("input.var").val();
    var value = $this.find("select.value").val();

    if (varname.length > longestVarname.length) {
      longestVarname = varname;
    }

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
  $div.css("font","10pt arial");
  var width = getTextWidth(longestVarname,"10pt arial");
  $div.width(100 +  width + "px");
  $div.html(blockContent);
  console.log(errors);

  redrawArrows($div);

}

function properVariableName(varname) {
  return true;
}



function openStartAndEndBlockMenu($div) {
  var html = "";
  var header = "";
  var description = "";
  var deleteButton = "";
  var removeArrowsButton = "";

  if ($div.text() == "START") {
    header = "Blok START";
    description = "Stanowi początek algorytmu, może być tylko jeden";
  } else {
    header = "Blok KONIEC";
    description = "Stanowi koniec algorytmu";
  }
  deleteButton        = "<p><button class='btn btn-danger' id='removeDivButton' type='button'>Usuń blok</button></p>";
  removeArrowsButton  = "<button class='btn btn-danger' id='removeArrowsButton' type='button'>Usuń strzałki</button>";


  html = "" +
  "<div class='page-header'>"+
    "<h3>"+header+"</h3>"+
    "<p><i>"+description+"</i></p>"+
    "<h3>"+"Opcje"+"</h3>"+
    "<div class='btn-group'>"+
    ""+deleteButton+
    ""+removeArrowsButton+
    "</div>"+
  "<div>";

  $('#pressedBlockInfo').html(html);

  $(document).ready(function(){
    //usuwanie diva
    $('#removeDivButton').click(function() {
      closeDivMenu($div);
      removeDiv($div);
    });

    $('#removeArrowsButton').click(function() {
        removeArrows($div);
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
