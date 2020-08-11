class DraftManager {
  constructor(draftContainer, htmlContent, fileId) {
    // perform sanity checks
    if(!fileId) throw(new Error('Invalid File'))
    if(typeof draftContainer === 'string') {
      let container = document.getElementById(draftContainer)
      if(container) this.container = container
      else throw(new Error(`Invalid container: ${draftContainer}`))
    } else {
      if(document.body.contains(draftContainer)) this.container = draftContainer
      else throw(new Error(`Invalid container node`))
    }
    // initialize
    this.content = htmlContent
    this.nodes = []
    this.selecting = false
    this.currentSelection = {}  // represents current selection on screen
    this.corrections = []
    this.container.innerHTML = htmlContent
    this.eventCount = 0
    this.fileId = fileId
    this.eventColors = {
      'rephrase': 'orange',
      'remove': 'red',
      'wrong-grammer': 'grey'
    }

    // add mouse events
    let that = this
    this.container.onmousedown = (e) => {
      that.selecting = true
    }

    this.container.onmousemove = (e) => {
      let c = that.getCordinates(e)
      if(that.selecting && !that.nodes.includes(document.elementFromPoint(c.clientX, c.clientY))) {
        console.log('mouse moving')
        if (that.container !== document.elementFromPoint(c.clientX, c.clientY))
           that.nodes.push(document.elementFromPoint(c.clientX, c.clientY))
      }
    }

    this.container.onmouseup = (e) => {
      console.log('mouse up')
      that.currentSelection = that.getSelection();

      // remove all child nodes
      for(let i = 0; i < that.nodes.length; i++) {
        for (let j = 0; j < that.nodes.length; j++) {
          if(that.nodes[i].contains(that.nodes[j]) && that.nodes[i] !== that.nodes[j]) {
            // remove node[j]
            that.nodes.splice(j,1)
            i = -1;
            break;
          }
        }
      }

      that.selecting = false;
    }
  }

  stripTags(html) {
    return html.replace(/(<([^>]+)>)/gi, "");
  }

  decodeHtml(html) {
    let strippedString = stripTags(html)
    var txt = document.createElement("textarea");
    txt.innerHTML = strippedString;
    return txt.value;
  }

  encodeHTMLEntities(txt) {
    let p = document.createElement("p");
    p.textContent = txt;
    return p.innerHTML
  }

  generateEventWrapper(htmlStr, options) {// console.log(options)
    /* options object format:
    {
      correctionName: 'name of the correction to be carried out',
      comment: 'optional comment describing the correction to be made',
      color: 'color that visually represent the correction',
      eventId: 'The unique id of this event'
    }
    */
    // return `<span style='color: white; background-color: orange' class = 'fms-v-2.7'>${htmlStr}</span>`

    return `<span style='background-color: ${options.color}; text-decoration: line-through black solid' class = 'fms-v-2.7 ${options.eventClass}'>${htmlStr}</span>`
  }


  createMessageUnder(options) {
    // create message element
    let messages = []
    let elements = document.getElementsByClassName(options.eventClass)

    for(let elem of elements) {
      // create message element
      let message = document.createElement('div')
      let title = document.createElement('p');
      title.style.cssText = `border-style: solid; border-top: 0; border-left: 0; border-right: 0; border-color: ${options.color}`
      let msgBody = document.createElement('p')

      title.innerHTML = options.type
      msgBody.innerHTML = options.comment
      message.appendChild(title)
      message.appendChild(msgBody)

      // better to use a css class for the style here
      message.style.cssText = "position:fixed; color: black; background-color: rgb(230,230,230); font-size: 13px; padding: 10px;";

      // assign coordinates, don't forget "px"!
      let coords = elem.getBoundingClientRect();

      message.style.left = coords.left + "px";
      message.style.top = coords.bottom + "px";

      messages.push({
        element: elem,
        content: message
      })
    }

    return messages;
  }

  hasWrapperEvent(node) {
    if (node.tagName === 'SPAN' && node.className === 'fms-v-2.7') return true
    return false
  }

  textNodesUnder(node){
   var all = [];
   for (node=node.firstChild;node;node=node.nextSibling){
     if (node.nodeType==3) all.push(node);
     else all = all.concat(this.textNodesUnder(node));
   }
   return all;
  }

  getCordinates(e) {
    let cordinates = {
      movementX: e.movementX,
      movementY: e.movementY,
      clientX: e.clientX,
      clientY: e.clientY,
      offsetX: e.offsetX,
      offsetY: e.offsetY,
      pageX: e.pageX,
      pageY: e.pageY,
      screenX: e.screenX,
      screenY: e.screenY,
      region: e.region,
      which: e.which
    }
    return cordinates
  }

  getSelection() {
   var selObj = window.getSelection();
   var selRange = selObj.getRangeAt(0);
   let text = selObj.toString()
   return {
     text,
     startOffset: selRange.startOffset,
     endOffset: selRange.endOffset,
     anchorOffset: selObj.anchorOffset,
     focusOffset: selObj.focusOffset,
     startNode: selRange.startContainer,
     endNode: selRange.endContainer
   }
  }


  /*
    this function is similar to string.replace() function, except that it only replaces the substr that occurs between position i, j
  */
   replaceBetween(i, j, substr, newSubstr, string) {
     let leftStr = string.substr(0, i)
     let str = string.substr(i, substr.length)
     let rightStr = string.substr(j+1)

     // replace str
     str = str.replace(substr, newSubstr)

     // return concatenated string
     return leftStr + str + rightStr
   }


   /*
     given a start and end positions (i and j respectively) in a string, find the nth substring in the string
     in other words, assume that the substr occurs multiple times in a string, find the nth substr that accurs between i, j
     Note: A return value of 0 (zero) means that the substr never occurs in the string
     the function works by sliding the substr through the string to
     1. find a match
     2. count the number of matches
     3. return the number matches so far if position intersects (or returns a zero if no match is found)
   */
   getOffset (i, j, substr, string) {
     let m = 0
     let n = substr.length
     let offset = 0
     for(let k = 0; k <= string.length - substr.length; k++) {
       if(string.substr(m, n) === substr) offset++
       if(m === i) return offset
       m++
     }
     return 0
   }

   /*
     given an offset (which represents the nth substr in a string), find the starting position of the substr
     the function works by sliding the substr through the string to
     1. find a match
     2. count the number of matches
     3. return the starting position of the substr if number of matches = offset
   */
    getPosition(offset, substr, string) {
      let m = 0
      let n = substr.length
      let p = 0
      let str = stripTags(string)
       // slide the substr through the string
      for(let k = 0; k <= str.length - substr.length; k++) {
        let subs = str.substr(m, n)
        if(subs === substr) p++
        // console.log(m, n,subs.length, offset,p, subs)
        if(p === offset) return m
        m++
      }
      return -1
    }

    replaceWithoutTags(offset, substr, string, options) {
      let p = 0  // offset counter
      let matchFound = false
      let tag = false
      let isClosingTag = false
      let partialStr = ''
      let matchedStr = ''
      let str = string // main string
      let modifiedStr = '' //

       //
      for(let k = 0, i = 0; k < str.length; k++, i++) {
        if (str[k] === substr[i] && !tag) {  // match found
          matchFound = true
          partialStr += str[k]
        } else if (str[k] === '<') {
            if(str[k+1] === '/') isClosingTag = true
            else isClosingTag = false
            tag = true
            // is it safe to replace what we have so far?
            if (p === offset - 1) {
              if(partialStr) modifiedStr += this.generateEventWrapper(partialStr, options)
              matchedStr += partialStr
              partialStr = ''
            }
            modifiedStr += str[k]
           --i  // move the index back one unit
        } else if (str[k] === '>') {
          tag = false
          modifiedStr += str[k]
          --i  // move the index back one unit
        }
        else { // match not found
          if (!tag) {
            matchFound = false
            matchedStr += partialStr

            if (matchedStr === substr) {
              p++  // increase offset count
            }
            matchedStr = ''

            if (p === offset && i === substr.length) {
              if(partialStr) modifiedStr += this.generateEventWrapper(partialStr, options)
            } else {
              modifiedStr += partialStr
            }
            partialStr = ''
            i = -1  // reset the index to the substring

          } else {
            --i
          }
          modifiedStr += str[k]
        }
      }
      if (p === offset-1) {
        if(partialStr) modifiedStr += this.generateEventWrapper(partialStr, options)
      } else {
        modifiedStr += partialStr
      }

      // return modified string
      return modifiedStr
    }

    // main entry point to the draft module
    markSelection(selectionType, comment) {
      let txt = this.currentSelection.text
      if(txt) {
        this.eventCount++
        let correction = {
          type: selectionType,
          selection: this.currentSelection,
          nodes: this.nodes,
          comment: comment,
          eventClass: `file-${this.fileId}_event-${this.eventCount}`,
          color: this.eventColors[selectionType]
        }
        // console.log('SELECTED:',txt)

        this.corrections.push(correction)
        this.attachEvent(correction)

        // re-attach all mouse events
        for(let c of this.corrections) {
            this.actionBox(c)
        }
      }
      this.nodes = []
      this.currentSelection = {}
    }

    actionBox(options) {
      let that = this
      let messages = that.createMessageUnder(options);

      messages.forEach((message) => {
        message.element.onmouseover = (e) => {
          document.body.append(message.content);
        }
        message.element.onmouseout = (e) => {
          message.content.remove()
        }
        message.element.ondblclick = (e) => {
          console.log('item double clicked', message.element)
          let parentNode = message.content.parentNode
          parentNode.innerHTML = message.content.innerHTML
          // message.element
        }
      })
    }


    attachEvent(options) {
      // let selectedTxt = this.currentSelection;
      let selectedTxt = options.selection;
      let nodes = options.nodes

       let txt = selectedTxt.text
       if(txt) {
         let nodeCount = 0
         for (let node of nodes) {
           nodeCount++ // keep track of number of nodes processed
           if (txt.includes(node.innerText)) { // full selection
             // check for duplicate event wrapper
             // if(this.hasWrapperEvent(node)) return

             // add event wrapper
             node.innerHTML = this.generateEventWrapper(node.innerHTML, options)
             txt = txt.replace(node.innerText, '') // remove processed text from selection
           } else { // half selection
             // initialize
             let str = ''
             let txtNodes = this.textNodesUnder(node) // get all text nodes
             let startIndex = 0
             let endIndex = 0
             let n = 0
             let focusOffset = selectedTxt.focusOffset
             let anchorOffset = selectedTxt.anchorOffset
             let startNode = selectedTxt.startNode
             let endNode = selectedTxt.endNode

             // discard other nodes
             if(nodes.length > 1 && nodeCount === 1) {
               endNode = txtNodes[txtNodes.length - 1]
               focusOffset = txtNodes[txtNodes.length - 1].textContent.length
               str = ''
             }

             if(nodes.length > 1 && nodeCount !== 1) {
               // str = txt.trim()
               startNode = txtNodes[0]
               anchorOffset = 0
             }

             // scan through text nodes to find the appropriate start / end index
             let withinString = false
             for(let i = 0; i < txtNodes.length; i++) {
               if(txtNodes[i] === startNode) {
                 startIndex = anchorOffset + n
                 withinString = true
               }

               if (withinString) str += txtNodes[i].textContent

               if(txtNodes[i] === endNode) {
                 endIndex = focusOffset + n
                 withinString = false
               }
               n += txtNodes[i].textContent.length
             }

             // determine the text involved in the selection via the anchorOffset
             if(nodes.length > 1 && nodeCount === 1) {
               str = str.substr(anchorOffset)
               txt = txt.replace(str, '') // remove processed str from selection
             } else if(nodes.length > 1 && nodeCount !== 1) {
               str = txt.trim()
             } else {
               str = txt
             }

             // get the offset from the remaining copied txt
             let offset = this.getOffset(startIndex, endIndex, str, node.innerText)

             // convert txt to HTML entities and replace in innerHTML of node
             let converted = this.encodeHTMLEntities(str);
             node.innerHTML = this.replaceWithoutTags(offset, converted, node.innerHTML, options)
           }
         }
       }
     }
}
