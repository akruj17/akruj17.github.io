let eventTemplate = Handlebars.compile(document.getElementById('event').innerHTML);
let dateTemplate = Handlebars.compile(document.getElementById('date').innerHTML)
let currentDateDiv;
let currentWrappedDateDiv;

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
            }
        })
    })
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
