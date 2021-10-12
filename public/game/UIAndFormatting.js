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

//Function that appends a card at a supplied location with supplied content with formatting
function createCard(destination, cardContent, color){
    cardContent = cardContent || ' '
    color = color || 'white'
    //Creates card div
    let cardDiv= document.createElement('div')
    //Assigns div the card class and the appropriate card color class
    let cardDivClass = 'card ' + color + 'Card'
    cardDiv.className = cardDivClass
    //Determines the number of lines of the card content
    let contentHeight = numberOfLines(cardContent)
    let contentDivClass = 'cardContent'
     if(contentHeight === 1){
        contentDivClass += ' shortContent'
     }
    //Creates div for card's content
    let contentDiv = document.createElement('div')
    //Sets appropriate class and innerHTML content for the card content div
    contentDiv.className = contentDivClass
    contentDiv.innerHTML = cardContent
    //Attempts to center content based on length of card content, 4.9 and 0.75 are magic numbers.
    let dynamicPadding = 0.5
    if(contentHeight < 7){
        dynamicPadding = 4.9 - contentHeight*0.75
    }
    else{
        contentDiv.style.fontSize = '1.2vw'
    }
    contentDiv.style.paddingTop = dynamicPadding + 'vw'
    //Appends cardContent into card div
    cardDiv.appendChild(contentDiv)
    //Appends card to destination
    destination.appendChild(cardDiv)
}

//Renders a namePlate
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
        namePlateFontSize = 2 - extraTextLength*magicSlope
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