/*ﾟ･*:.｡..｡.:*･ﾟ ﾟ･*:.｡..｡.:*･ﾟ ﾟ･*:.｡..｡.:*･ﾟ ﾟ･*:.｡..｡.:*･ﾟ

  Olelo 1.0.2
  Olelo markdown files as html.

  Copyright 2018- Ringo Takemura

  Licensed under MIT (http://opensource.org/licenses/MIT)
  Released on: May 1, 2018

  ﾟ･*:.｡..｡.:*･ﾟ ﾟ･*:.｡..｡.:*･ﾟ ﾟ･*:.｡..｡.:*･ﾟ ﾟ･*:.｡..｡.:*･ﾟ*/

var Olelo = function(filepath, id){

  'use strict';

  var md,
      mdArray,
      baseIndent, //base indent;
      anchorBase = '★錨',//indent 0 => ★錨, indent 1 => ★錨★錨 ;
      html = anchorBase,
      i = -1,
      timeStarted = new Date();

  if(!checkId()) return;

  readFile();

  function checkId(){
    var node = document.getElementById(id);
    if(!node){
      console.error('There is no same id in the HTML.');
      return false;
    }
    return true;
  }

  function readFile(){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', filepath);
    xhr.onload = function (e) {
      if(!checkFilepath(xhr)) return;
      makeHtml(xhr.responseText);
    }
    xhr.send();
    return;
  }

  function checkFilepath(xhr){
    if(xhr.readyState != 4 || xhr.status != 200){
      console.error('There is incorrect markdown file path.');
      return false;
    }
    return true;
  }

  function makeHtml(md){
    //clean markdown;
    md = cleanMarkdown(md);

    //get indent;
    baseIndent = getFirstIndent(md);

    //make markdown array
    //mdArray = md.match(/(?<=^|\n).*(\n|.*$)/g);
    mdArray = md.split('\n');

    //replace for 1 row
    while(true){
      i++;
      if(i >= mdArray.length) break;
      if(mdArray[i].match(/^[\s\n]*$/)) continue;

      var currentHash = {};
      var currentType = getTagType(mdArray[i]);
      currentHash['type'] = currentType;
      currentHash['line'] = mdArray[i];
      currentHash['indent'] = getIndent(mdArray[i], baseIndent);
      currentHash['anchor'] = getAnchor(currentHash['indent']);

      //delete indent anchor
      deleteLessAnchor(currentHash['indent'], anchorBase);

      if(currentType === 'script'){ makeScript(currentHash); continue; } 
      if(currentType === 'commentOnlyMd'){ makeCommentOnlyMd(currentHash); continue; }
      if(currentType === 'comment'){ makeComment(currentHash); continue; }
      if(currentType === 'pre'){ makePre(currentHash); continue; }
      if(currentType === 'div'){ makeDiv(currentHash); continue; }
      if(currentType.match(/^headline/)){ makeHeadline(currentHash); continue; }
      if(currentType === 'list'){ makeList(currentHash); continue; }
      if(currentType === 'table'){ makeTable(currentHash); continue; }
      if(currentType === 'other'){ makeOther(currentHash); continue; }
      if(currentType === ''){ makeNoTag(currentHash); continue; }
    }

    deleteLessAnchor(-1, anchorBase);
    html = html.replace(/([\s\n]*)\n/g, '\n');
    document.getElementById(id).insertAdjacentHTML('beforeend', html);
    console.info('Olelo has finished. HTML was generated in ' + String(new Date() - timeStarted) + ' ms');
    return;
  }

  function makeScript(hash){
    var indent = hash['indent'];

    //start
    var elm = document.createElement('script');
    while(true){
      i++;
      if(i >= mdArray.length) break;
      var line = mdArray[i]+'\n';

      var indent2 = getIndent(line, baseIndent);
      //end
      if(indent2 <= indent && line.match(/[^\s\n]+/)){
        i--;
        break;
      }

      elm.textContent += line;
    }
    document.getElementsByTagName('body')[0].insertBefore(elm, null);
  }


  function makeCommentOnlyMd(hash){
    var indent = hash['indent'];

    //start
    if(i >= mdArray.length) return;
    while(true){
      i++;
      var line = mdArray[i];
      var indent2 = getIndent(line, baseIndent);
      //end
      if(indent2 <= indent && line.match(/[^\s]+/)){
        i--;
        break;
      }
    }
  }


  function makeComment(hash){
    var indent = hash['indent'];
    var line = hash['line'];
    line = line.replace(/\s*\/\//, '');

    //start
    putHtml('--', '', line, indent, true);
    if(i >= mdArray.length) return;
    while(true){
      i++;
      line = mdArray[i]+'\n';
      var indent2 = getIndent(line, baseIndent);
      //end
      if(indent2 <= indent && line.match(/[^\s\n]+/)){
        i--;
        break;
      }
      putHtmlIntoUpper(line, indent);
    }
  }

  function makePre(hash){
    var line = hash['line'];
    var indent = hash['indent'];
    var isFirstLine = true;
    var attr = line.match(/`([^`]*)$/);

    //start
    putHtml('pre', getAttr(attr[1]), '', indent, true);
    putHtml('code', '', '', indent, true);

    var RESpaceAfterOpenCode = new RegExp('(\\<code\\>)(\\s*)' + anchorBase);
    html = html.replace(RESpaceAfterOpenCode, '$1' + anchorBase);

    var RESpaceBeforeOpenCode = new RegExp('(\\>)([\\s\\n]*)(\\<code\\>)' + anchorBase);
    html = html.replace(RESpaceBeforeOpenCode, '$1$3' + anchorBase);

    var RESpaceAfterCloseCode = new RegExp('(\\</code\\>)([\\s\\n]*)' + anchorBase);
    html = html.replace(RESpaceAfterCloseCode , '$1' + anchorBase);

    var RESpaceBeforeClosePre  = new RegExp(anchorBase + '([\\s\\n]*)(\\</pre\\>)');
    html = html.replace(RESpaceBeforeClosePre, anchorBase + '$1');

    i++;
    if(i >= mdArray.length) return;
    while(true){
      line = mdArray[i];
      //end
      var indent2 = getIndent(line, baseIndent);
      if(indent2 < indent) break;
      if(line.match('```')) break;

      var spaceRE = new RegExp('^' + setIndent(indent));
      line = line.replace(spaceRE, '');

      line = line.replace(/&/g, '&amp;');
      line = line.replace(/'/g, '&#x27;');
      line = line.replace(/`/g, '&#x60;');
      line = line.replace(/"/g, '&quot;');
      line = line.replace(/</g, '&lt;');
      line = line.replace(/>/g, '&gt;');
      if(isFirstLine){
        isFirstLine = false;
        putHtmlIntoUpper(line, 0);
      }
      else{
        putHtmlIntoUpper('\n' + line, 0);
      }
      i++;
    }
  }

  function makeDiv(hash){
    var line = hash['line'];
    var indent = hash['indent'];

    putHtml('div', getAttr(line), getText(line, false), indent, true);
  }

  function makeHeadline(hash){
    var line = hash['line'];
    var indent = hash['indent'];
    var tag = 'h' + hash['type'].match(/\d$/)[0];
    putHtml(tag, getAttr(line), getText(line, false), indent, html, true);
  }

  function makeList(hash){
    var indent = hash['indent'];
    //start
    putHtml('ul', '', '', indent, html, true);
    while(true){
      var line = mdArray[i];
      if(getTagType(line) != 'list'){
        break;
      }
      putHtml('li', '', getText(line, false), indent + 1, false);
      i++;
      if(i >= mdArray.length) break;
    }
  }

  function makeTable(hash){
    var indent = hash['indent'];
    var line = hash['line'];
    var attr = line.match(/\|([^\|]*)$/);

    //start
    putHtml('table', getAttr(attr[1]), '', indent, true);
    deleteLessAnchor(indent+1);
    putHtml('thead', '', '', indent+1, true);
    
    //th
    while(true){
      line = mdArray[i];
      if(line.match(/^[\|\-]*[\s\n]*$/)){
        break;
      }

      deleteLessAnchor(indent+2);
      putHtml('tr', '', '', indent+2 , true);

      var thArr = line.replace(/\s*\|\s*/g, '|');//remove spaces
      thArr = thArr.match(/\|.*(?=\|)/)[0].split('|');
      for(var ii = 1; ii < thArr.length; ii++){
        deleteLessAnchor(indent+3);
        var text = thArr[ii].replace(/^\s+/, '').replace(/\s+$/, '');
        text = getText(text, true);
        putHtml('th', '', text, indent+3, true);
      }
      i++;
      if(i >= mdArray.length) break;
    }

    deleteLessAnchor(indent+1);
    putHtml('tbody', '', '', indent+1, true);
    i++;
    if(i >= mdArray.length) return;

    //td
    while(true){
      line = mdArray[i];
      if(getTagType(line) != 'table'){
        break;
      }

      deleteLessAnchor(indent+2);
      putHtml('tr', '', '', indent+2 , true);

      var trArr = line.replace(/\s*\|\s*/, '|');//remove spaces
      trArr = trArr.match(/\|.+(?=\|)/)[0].split('|');
      for(var ii = 1; ii < trArr.length; ii++){
        deleteLessAnchor(indent+3);
        var text = trArr[ii].replace(/^\s+/, '').replace(/\s+$/, '');
        text = getText(text, true);
        putHtml('td', '', text, indent+3, html, true);
      }
      i++;
      if(i >= mdArray.length) break;
    }
  }


  function makeOther(hash){
    var line = hash['line'];
    var indent = hash['indent'];
    var tag = line.match(/(^ *)(\w+)/)[2];
    putHtml(tag, getAttr(line), getText(line, false), indent, true);
  }

  function makeNoTag(hash){
    var line = hash['line'];
    var indent = hash['indent'];
    putHtmlIntoUpper(getText(line, true), indent);
  }

  function cleanMarkdown(md){
    return md.replace(/\r\n|\r/g, '\n')
      .replace(/\t/g, '  ')
      .replace(/\u00a0/g, ' ')
      .replace(/\u2424/g, '\n');
  }

  function getFirstIndent(md){
    if(md.match(/(\n)( +)/)){
      return md.match(/(\n)( +)/)[2].length;
    }
    return 2;
  }

  function getIndent(line, baseIndent){
    if(line == ''){
      return 0;
    }
    return line.match(/^\s+/) ? line.match(/^\s+/)[0].length / baseIndent : 0;
  }

  function setIndent(indent){
    var res = '';
    var space = '  ';
    for(var i = 0; i < indent; i++){
      res += space;
    }
    return res;
  }

  function getAnchor(indent){
    var res = '';
    for(var i = 0; i < indent + 2; i++){
      res += anchorBase;
    }
    return res;
  }

  function getAttr(line){
    var res = '';
    line = line.replace(/^\s*/, '');

    //tag
    var tagRE = line.match(/^(\w+)(?=(#|\.|\s|\(|\n|$))/);
    if(tagRE){
      line = line.replace(tagRE[1], '');
    }

    //id
    var idRE = line.match(/^#([\w\-]+)(?=(#|\.|\s|\(|\n|$))/);
    if(idRE){
      res += ' id="' + idRE[1] + '"';
      line = line.replace('#' + idRE[1], '');
    }

    //class
    var classRE = line.match(/^\.([^\s\(\n]+)(?=(\s|\(|\n|$))/);
    if(classRE){
      var classNames = '';
      var classArray = classRE[1].split('.');
      for(var i = 0; i < classArray.length; i++){
        classNames += classArray[i].replace('.', '') + ' ';
      }
      classNames = classNames.replace(/ $/, '');
      res += ' class="' + classNames + '"';
      line = line.replace(classRE[0], '');
    }

    //othre attr
    var otherRE = line.match(/^\(([^\)]*)\)(?=(\s|\n|$))/);
    if(otherRE){
      res += ' ' + otherRE[1];
    }

    return res;
  }


  function getText(line, isNotTag){
    line = line.replace(/^\s*/, '');
    var text = '';
    if(isNotTag){
      text = line;
    }
    else{
      text = line.match(/(\s)(.*)/);
      if(!text){
        return '';
      }
      text = text[2];
    }

    //br
    text = text.replace(/  /g, '<br>');

    //comment only md
    text = text.replace(/(^|\s+)\/\/\-.*/, '');

    //comment
    text = text.replace(/(^|\s+)\/\/(.*)/, '<!-- $2 -->');

    //img#aaa.bbb.ccc => <img id="aaa" class="bbb ccc">
    text = text.replace(/\[([\w\#\-]+)\.([\w\.\-]*)\(/g, '[$1(class="$2"').replace(/\[(\w+)\#([\w\-]+)\(/, '[$1(id="$2"').replace(/class="[\w\-\.]+/g, function(){
      return arguments[0].replace(/\./g, ' ');
    });;

    //a...
    //[a(href="" target="")link]
    text = text.replace(/\[(\w+)\(([^\)]*)\)([^\]]+)\]/g, '<$1 $2>$3</$1>');

    //img...
    //[img(src="" alt="")]
    text = text.replace(/\[(\w+)\(([^\)]*)\)\]/g, '<$1 $2>');

    //i, b...
    //[i text]
    text = text.replace(/\[(\w+) ([^\]]+)\]/g, '<$1>$2</$1>');

    return text;
  }


  function getTagType(line){
    line = line.replace(/^ +/, '');

    //script type
    if(line.match(/^script(\s|\n|$)/)){
      return 'script';
    }

    //comment type
    if(line.match(/^\/\/\-/)){
      return 'commentOnlyMd';
    }

    //comment type
    if(line.match(/^\/\//)){
      return 'comment';
    }

    //pre type
    if(line.match(/^```/)){
      return 'pre';
    }

    //div type
    if(line.match(/^(\.|#)\w+/)){
      return 'div';
    }

    //headline type
    if(line.match(/^#+/)){
      return 'headline' + String(line.match(/^#+/)[0].length);
    }

    //list type
    if(line.match(/^- /)){
      return 'list';
    }

    //table type
    if(line.match(/^\|/)){
      return 'table';
    }

    //other type
    if(line.match(/^[\w]+(?=(\s|\(|\#|\.|\n|$))/)){
      return 'other';
    }

    return '';
  }

  function deleteLessAnchor(indent){
    var re = new RegExp('(' + anchorBase + '\\n?){' + String(indent + 2) + ',}(\\s*)' , 'g');
    html = html.replace(re, '');
  }

  function putHtml(tag, attrStr, text, indent, hasEndTag){
    var currentAnchor = getAnchor(indent);
    var upperAnchor = getAnchor(indent - 1);
    var beforeUpperAnchorRE = new RegExp('(?=' + upperAnchor + ')');

    var res = '\n' + setIndent(indent) + '<' + tag ;
    res += attrStr;
    res += '>\n' + setIndent(indent + 1) ;
    res += text + '\n' + setIndent(indent) ;
    res += currentAnchor;
    res += hasEndTag ? setIndent(indent) + '</' + tag + '>\n' : '';

    if(tag == '--'){
      res = res.replace('<-->', '<!-- ').replace('</-->', ' -->');
    }

    html =  html.replace(beforeUpperAnchorRE, res);
  }

  function putHtmlIntoUpper(text, indent){
    var currentAnchor = getAnchor(indent);
    var upperAnchor = getAnchor(indent - 1);
    var beforeUpperAnchorRE = new RegExp('(?=' + upperAnchor + ')');
    var res = setIndent(indent) + text;

    html =  html.replace(beforeUpperAnchorRE, res);
  }
};

