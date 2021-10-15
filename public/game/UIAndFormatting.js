let testCardContent = document.getElementById('testCardContent');

//Function that tests how many lines card content will take up.
function numberOfLines(cardContent){
    //Determines the height of a single line based on current view window by filling in an invisible card and checking
    testCardContent.innerHTML = 'testLine'
    let singleLineHeight = document.getElementById('testCardContent').clientHeight
    //Determines the number of lines of card content by checking total height and dividing it by the height of a single line and rounding it to the nearest integer
    testCardContent.innerHTML = cardContent
    let numberOfLines =  Math.round(document.getElementById('testCardContent').clientHeight/singleLineHeight)
    //Resets inner HTML of hidden card content
    testCardContent.innerHTML = ''
    return numberOfLines
}

function generateFontSize(cardContent){
    let testCard = document.getElementById('hiddenTestCard')
    let testCardContent = document.getElementById('testCardContent')
    let testCardHeight = testCard.clientHeight
    testCardContent.innerHTML = cardContent
    let magicCardHeightToTextRatio = 0.6
    let fontSize = 0

    for(let i = 1.3; i > 0.5; i = i - 0.1){
        testCardContent.style.fontSize =  i + 'vw'
        let testCardContentHeight = testCardContent.clientHeight
        
        if(testCardContentHeight/testCardHeight < magicCardHeightToTextRatio){
            fontSize = i
            break
        }
    }
    
    return fontSize

}

function generatePadding(cardContent, fontSize){
    let testCard = document.getElementById('hiddenTestCard')
    let testCardContent = document.getElementById('testCardContent')
    function convertUnits(){
        let currentPadding = testCardContent.style.paddingTop
        testCardContent.style.paddingTop = '0vw'
        let noPaddingContentHeight = testCardContent.clientHeight
        testCardContent.style.paddingTop = '1vw'
        let onePaddingContentHeight = testCardContent.clientHeight
        testCardContent.style.paddingTop = currentPadding
        return onePaddingContentHeight - noPaddingContentHeight
    }
    testCardContent.innerHTML = cardContent
    testCardContent.style.fontSize = fontSize + 'vw'
    let unitConversion = convertUnits()
    let desiredHeight = 0.8*testCard.clientHeight
    let currentHeight = testCardContent.clientHeight
    if(currentHeight < desiredHeight){
        return (desiredHeight - currentHeight)/unitConversion
    }
}

//Function that appends a card at a supplied location with supplied content with formatting
function createCard(destination, cardContent, color){
    cardContent = cardContent || ' '
    color = color || 'white'
    //Creates card div
    let cardDiv= document.createElement('div')
    //Assigns div the card class and the appropriate card color class
    let cardDivClass = 'card ' + color + 'Card'
    cardDiv.className = cardDivClass

    let contentDiv = document.createElement('div')
    let contentDivClass = 'cardContent'
    contentDiv.innerHTML = cardContent
    let fontSize = generateFontSize(cardContent)
    contentDiv.style.fontSize = fontSize  + 'vw'
    
    //Determines the number of lines of the card content
    let contentHeight = numberOfLines(cardContent)
    
    let dynamicPadding = 0

     if(contentHeight === 1){
        contentDivClass += ' shortContent'
     }
     else if(contentHeight === 2){
         dynamicPadding = 3.3
     }
     
     else if(contentHeight === 3){
        dynamicPadding = 2.5
    }

    else if(contentHeight === 4 && fontSize < 1.2){
        dynamicPadding = 2.6
    }
    else if(contentHeight === 5 && fontSize < 1){
        dynamicPadding = 2.4
    }
     /*else if(contentHeight < 5 && fontSize >= 1.2){
        dynamicPadding = 4.9 - contentHeight*0.6*/

    //}
     else{
         dynamicPadding = generatePadding(cardContent, fontSize)

     }
     contentDiv.className = contentDivClass
     contentDiv.style.paddingTop = dynamicPadding + 'vw'

    //Appends cardContent into card div
    cardDiv.appendChild(contentDiv)
    //Appends card to destination
    destination.appendChild(cardDiv)
}

//Renders a
function createNamePlate(name, score){
    let namePlateDiv = document.createElement('div')
    namePlateDiv.className = 'namePlate'
    let namePlateContentDiv = document.createElement('div')
    namePlateContentDiv.className = 'namePlateContent'
    //Sets default font size
    let namePlateFontSize = 2
    
    //Adjusts font size based on text length, using magic numbers
    if(name.length > 40){
        let extraTextLength = name.length - 40
        let magicSlope = 1.62/name.length
        namePlateFontSize = 1.8 - extraTextLength*magicSlope
        if (namePlateFontSize < 0.2){
            namePlateFontSize = 0.2
        }
    }
    //If name length is especially long, makes nameplate scrollable
    if(name.length>400){
        namePlateContentDiv.style.overflowY='scroll'
    }
    namePlateContentDiv.style.fontSize = namePlateFontSize + 'vw'
    namePlateContentDiv.innerHTML = name
    
    let scoreContainerDiv = document.createElement('div')
    scoreContainerDiv.className = 'scoreContainer'
    let scoreContentDiv = document.createElement('div')
    scoreContentDiv.className = 'scoreContent'
    scoreContainerDiv.appendChild(scoreContentDiv)
    scoreContentDiv.innerHTML = score

    informationPanel.appendChild(namePlateDiv)
    namePlateDiv.appendChild(namePlateContentDiv)
    namePlateDiv.appendChild(scoreContainerDiv)

}

//clears a section
function clearSection(section){
    let i = 0
    //Adds an extra increment if informationPanel and playerHand, because have a hidden child for formatting
    if (section.id === 'informationPanel' || section.id === 'playerHand'){
        i += 1
    }

    while(section.children[i]){
        section.removeChild(section.children[i])
    }
}