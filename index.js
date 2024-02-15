const buttons = document.querySelector('.press_text');
const inputText = document.querySelector('.my_text');
const formText = document.querySelector('.input_text');
const innerText = document.querySelector('.inner_text');

const dumpDate = () => {
    const dat = new Date();
    return `${dat.getHours()}:${dat.getMinutes()}:${dat.getSeconds()} ${dat.getDate()}-${dat.getMonth()}-${dat.getFullYear()}`;
}

buttons.addEventListener('click', (e) => {
    e.preventDefault();
    if(e.target.className == 'press_text' && inputText.value){
        innerText.innerText += dumpDate() + '\n' + localStorage.getItem('userName') + ': ' + inputText.value + '\n';
    }
});