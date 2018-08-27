let eventTemplate = Handlebars.compile(document.getElementById('event').innerHTML);
let dateTemplate = Handlebars.compile(document.getElementById('date').innerHTML)
let currentDateDiv;
let currentWrappedDateDiv;
let currentEvent;
let introShown = true
let circleOnRightSide = false
let screenSize = window.matchMedia("(min-width: 768px)")

document.addEventListener('DOMContentLoaded', () => {
    fetch('static/event-info.txt').then(response => response.text()).then(
        text => {
            let lines = text.split('\n')
            document.querySelector('.intro-text').innerHTML += lines[0]
            for (let i = 1; i < lines.length; i++) {
                let line = lines[i].split('\t')
                this.addEvent(line[0], line[1], line[2], i)
            }
        }
    ).then(() => {
        document.querySelectorAll('.radio').forEach(button => {
            button.onclick = function() {
                currentEvent = button.parentElement
                let wrappedDateDiv = document.querySelector(`#date-wrap${this.id.substring(4)}`)
                wrappedDateDiv.style.width = '500px'
                let dateDiv = document.querySelector(`#date${this.id.substring(4)}`)
                dateDiv.style.width = '500px'
                if (currentDateDiv && currentDateDiv != dateDiv) {
                    currentDateDiv.style.width = '200px'
                    currentWrappedDateDiv.style.width = '200px'
                }
                currentDateDiv = dateDiv
                currentWrappedDateDiv = wrappedDateDiv
                if (screenSize.matches) {
                    if (introShown) {
                        changeIntro(false, true)
                        introShown = false;
                    }
                    if (currentEvent.parentElement.id === 'timeline-top') { //collisions could occur
                        if (!document.querySelector('.timeline-container').onscroll) {
                            watchForCollision()
                        }
                    } else { //remove listener if it is present
                        document.querySelector('.timeline-container').onscroll = null
                    }
                }
            }
        })
    })

    screenSize.addListener(function() {
        introShown = true
        if (circleOnRightSide) {
            document.querySelector('.photo-container').style.left = '0%'
            document.querySelector('.profilephoto').className = 'profilephoto'
        }
        circleOnRightSide = false
        document.querySelectorAll('.radio').forEach(el => {
            el.checked = false;
        })
        if (currentDateDiv) {
            currentDateDiv.style.width = '200px'
            currentWrappedDateDiv.style.width = '200px'
            currentDateDiv = ''
            currentWrappedDateDiv = ''
        }
        document.querySelector('.intro').style.position = 'relative'
        if (!this.matches) {
            document.querySelector('.timeline-container').style = "margin-top: 0px;"
            document.querySelectorAll('.transition-element').forEach(el => {
                el.style.transitionDelay = '0s'
            })
        } else {
            document.querySelector('.timeline-container').style = "margin-top: -150px;"
            document.querySelectorAll('.transition-element').forEach(el => {
                el.style.transitionDelay = '1.1s'
            })
        }
        document.querySelector('.timeline-container').onscroll = null
        if (document.body.scrollHeight > document.body.offsetHeight) {
            document.body.overflowY = 'scroll'
        } else {
            document.body.overflowY = 'hidden'
        }
    })

    document.querySelector('.profilephoto').addEventListener('animationiteration', function() {
        circleOnRightSide = !circleOnRightSide
        this.style.animationPlayState = 'paused'
    }, false)
    document.querySelector('.photo-container').addEventListener('animationiteration', function() {
        this.style.animationPlayState = 'paused'
    }, false)
    document.querySelector('.intro-text-container').addEventListener('animationiteration', function() {
        this.style.animationPlayState = 'paused'
        document.querySelector('.intro').style.position = introShown ? 'relative' : 'fixed'
        document.querySelector('.timeline-container').style = introShown ? "margin-top: -150px;" : "display: flex; flex-direction: column; justify-content: center; height: 100%; padding-top:70px; margin-top: 0px;"
        document.querySelectorAll('.transition-element').forEach(el => {
            el.style.transitionDelay = introShown ? '1.1s' : '0s'
        })
    }, false)

    document.querySelector('.profilephoto').onclick =  function() {
        if (!introShown) {
            changeIntro(true, circleOnRightSide)
            introShown = true
            document.querySelectorAll('.radio').forEach(el => {
                el.checked = false;
            })
            currentDateDiv.style.width = '200px'
            currentWrappedDateDiv.style.width = '200px'
            currentDateDiv = ''
            currentWrappedDateDiv = ''
        }
    }

})

function addEvent(title, detailed, date, num) {
    const eventRow = (num % 2 === 0) ? 'top' : 'bottom'
    const dateRow = (num % 2 === 0) ? 'bottom' : 'top'
    let context = {num: num, top_row: eventRow === 'top', row: eventRow , paragraph_detailed: detailed,
        title:title};
    const event = eventTemplate(context);
    document.querySelector(`#timeline-${eventRow}`).innerHTML += event
    context = {num: num, row: dateRow, date_text: date}
    date = dateTemplate(context);
    document.querySelector(`#timeline-${dateRow}`).innerHTML += date
}

function changeIntro(showIntro , moveCircle) {
    const photo = document.querySelector('.profilephoto')
    photo.style.animationPlayState = moveCircle ? 'running' : 'paused'
    photo.className = 'profilephoto ' + ( showIntro ? '' : ' profilephoto-hover')
    document.querySelector('.photo-container').style.animationPlayState = moveCircle ? 'running' : 'paused'
    document.querySelector('.intro-text-container').style.animationPlayState = 'running'
}

function watchForCollision() {
    document.querySelector('.timeline-container').onscroll = function() {
        let photo = document.querySelector('.profilephoto')
        const rect = currentEvent.getBoundingClientRect()
        if (circleOnRightSide) {
            let rectEndPos = rect.x + rect.width + 20
            if (rectEndPos >= photo.getBoundingClientRect().x) {
                photo.style.animationPlayState = 'running'
                document.querySelector('.photo-container').style.animationPlayState = 'running'
            }
        } else { //on left
            let photoRect = photo.getBoundingClientRect()
            let photoEndPos = photo.x + photo.width
            if (rect.x <= photoEndPos) {
                photo.style.animationPlayState = 'running'
                document.querySelector('.photo-container').style.animationPlayState = 'running'
            }

        }
    }
}
