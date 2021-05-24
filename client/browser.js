`use strict`
var el = {};
var markupParser = null;

const changeTheme = (themeName) => {
    // Change CSS
    theme = themeName;
    var oldlinks = document.getElementsByTagName('link');
    var head = document.getElementsByTagName('head')[0];
    Object.values(oldlinks).forEach(link => {
        head.removeChild(link);
    });

    var newlink = document.createElement('link');
    newlink.setAttribute('rel', 'stylesheet');
    newlink.setAttribute('type', 'text/css');
    newlink.setAttribute('href', '../public/css/' + themeName + '.css');
    head.appendChild(newlink);

    // Change IMGs!
    var oldimg = document.getElementsByTagName('img');
    Object.values(oldimg).forEach(img => {
        if ('src' in img.dataset) {
            img.src = 'img/' + theme + '/' + img.dataset.src;
        }
    });
    // And... Image inputs?
    var oldimg = document.getElementsByTagName('input');
    Object.values(oldimg).forEach(img => {
        if (img.getAttribute('type') === 'image') {
            if ('src' in img.dataset) {
                img.src = 'img/' + theme + '/' + img.dataset.src;
            }
        }
    });

}

const getConfig = (name, defaultvalue) => {
    var value = window.localStorage.getItem(name);
    if (value) {
        return value;
    } else {
        return defaultvalue;
    }
}
const setConfig = (name, value) => {
    console.log(value);
    if (value) {
        window.localStorage.setItem(name, value);
    } else {
        window.localStorage.removeItem(name);
    }
}

theme = getConfig('theme', 'bubblegum');
font = getConfig('font', null);

const replaceButtons = () => {
    console.log(getConfig('serverList', "[]"));
    var div = document.createElement('div');
    div.className = 'broswerbuttonlist';
    JSON.parse(getConfig('serverList', "[]")).forEach(server => {
        console.log(server);
        var button = document.createElement('div');
        button.className = 'browserbutton';
        var img = document.createElement('img');
        img.className = 'browserbuttonimg';
        var title = document.createElement('div');
        title.className = 'browserbuttontitle';
        title.innerHTML = markupParser.makeHtml(server.name);
        img.src = server.url + server.img;
        button.appendChild(img);
        button.appendChild(title);
        div.appendChild(button);

        title.onclick = img.onclick = () => {
            console.log("Server chosen");
            window.ipc.send('connectToServer', { host: server.host, user: null });
        }

        // Add known accounts
    });
    el.serverbuttons.innerText = '';
    el.serverbuttons.appendChild(div);
};

window.onload = () => {
    markupParser = new showdown.Converter();
    var allElements = document.querySelectorAll('*[id]');
    allElements.forEach((element) => {
        el[element.id] = element;
    });

    el.browsertabbuttons.onclick = () => {
        replaceButtons();
        el.serverbuttons.style.display = 'flex';
        el.serverformdiv.style.display = 'none';

    }
    el.browsertabform.onclick = () => {
        el.serverbuttons.style.display = 'none';
        el.serverformdiv.style.display = 'flex';
    }
    el.browsertabbuttons.onclick();

    el.serverform.onsubmit = (e) => {
        e.preventDefault();

        var ip = el.serverip.value;

        var server = { host: ip, name: '', img: '', users: [], url: '/public/' };

        ws = new WebSocket(ip);
        var timeout = null;

        ws.onmessage = (message) => {
            console.log(message);
            var json = JSON.parse(message.data);
            if (json.type === 'connect') {
                server.name = json.message;
                server.img = json.icon;
                server.url = json.url;

                var serverlist = JSON.parse(getConfig('serverList', "[]"));
                serverlist.push(server);
                setConfig('serverList', JSON.stringify(serverlist));

                el.serverip.value = '';
                el.browsertabbuttons.onclick();
                replaceButtons();
            }
            clearTimeout(timeout);
        };
        ws.onclose = () => {
            ws.close();
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => ws.close(), 1000);

        return false;
    }

    replaceButtons();
    changeTheme('bubblegum');
}