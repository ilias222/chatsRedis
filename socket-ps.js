
let rotationMessage = false;

export const dumpDate = (unix=false) => {
    let dat;
    unix == false ? dat = new Date() : dat = new Date(unix);
    return `${dat.getHours()}:${dat.getMinutes()}:${dat.getSeconds()} ${dat.getDate()}-${dat.getMonth()}-${dat.getFullYear()}`;
    }

export const positionMessage = () => {
      const myitem = document.createElement('p');
      myitem.className = setTimeout(dumpDate().slice(6,8), 1000) + '_message';

        if(!rotationMessage){
          myitem.style.backgroundColor = 'beige';
          myitem.style.textAlign = 'start';
          rotationMessage = true;
        } else{
          myitem.style.backgroundColor = 'floralwhite';
          myitem.style.textAlign = 'end';
          rotationMessage = false;
        }
    
      return myitem;
  }