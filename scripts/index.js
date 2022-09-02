const requestsCardsContainer = document.querySelector("#b1");
const addNewRequestButton = document.querySelector("#add-row");
const submitNewRequestButton = document.querySelector("#submit-row");
const defaultNewCard = document.querySelector(".new-container").querySelector(".new");
const teamListUL = document.querySelector(".team-list");
const requestCardContainer = document.querySelector("#b1");
const queueCardContainer = document.querySelector("#b2");
const inProgressCardContainer = document.querySelector("#b3");
const doneCardContainer = document.querySelector("#b4");
const holdCardContainer = document.querySelector("#b5");
let AllData = [];
let newRequestId;
let teams = [];
let memberships = [];
let role;
const accessToken = localStorage.getItem("access_token");
const userId = localStorage.getItem("user_id");
const userName = localStorage.getItem("user_name");
const lastActiveTeam = localStorage.getItem('active_team');

if (!accessToken || !userId || !userName) {
    window.location.href = 'login-register.html'
}
const baseURL = `https://tech-todo.herokuapp.com`;
async function fetchData(url, options, append = 1) {
    let finalURL;
    if (append == 0) {
        finalURL = url;
    } else {
        finalURL = baseURL + url;
    }
    let res = await fetch(finalURL, options);
    try {
        let json = await res.json();
        if (json.message == "ACCESS_DENIED") {
            localStorage.removeItem("access_token");
            localStorage.setItem("multi_login", 1);
            window.location.href = `http://${window.location.host}/login-register.html`;
        }
        return json;
    } catch {
        return res;
    }
}

fetchData(`/teams`, {
    method: "GET",
    headers: {
        authorization: accessToken,
        "Content-Type": "application/json"
    }
}).then(res => {
    if (res.status == "OKAY") {
        teams = res.data;
        teams.forEach(team => {
            let li = document.createElement('li');
            teamListUL.appendChild(li);
            li.outerHTML = `<li data-id="${team.id}" onclick="switchTeam('${team.id}')">
                            <a href="#">
                                <i class="${team.icon}"></i>
                                <span>${team.name}</span>
                            </a>
                        </li>`
        })
    }
    if (!lastActiveTeam) {
        teamListUL.querySelector('li').classList.add('active');
        localStorage.setItem('active_team', teams[0].id)
        fetchTodo();
    } else {
        teamListUL.querySelector(`li[data-id="${lastActiveTeam}"]`).classList.add('active');
        fetchTodo();
    }
})
fetchData(`/memberships`, {
    method: "GET",
    headers: {
        authorization: accessToken,
        "Content-Type": "application/json"
    }
}).then(res => {
    if (res.status == "OKAY") {
        memberships = res.data;
    }
})

function addNewRequest() {
    let newCard = defaultNewCard.cloneNode(true);
    let uid = uuid.v4();
    newRequestId = uid;
    newCard.setAttribute('data-id', uid);
    requestsCardsContainer.appendChild(newCard);
    addNewRequestButton.style.display = 'none';
    submitNewRequestButton.style.removeProperty('display');
    submitNewRequestButton.classList.add('disabled');
}

function submitNewRequest() {
    let card = document.querySelector(`.drop-card[data-id="${newRequestId}"]`);
    let value = card.querySelector(".new-request-input").value.toString().trim();
    let description = card.querySelector(".new-request-desc").value.toString().trim();
    let priority = card.querySelector(`.priority input[type="radio"]:checked`).value;
    if (value.length == 0 || description.length == 0) {
        return;
    }
    card.classList.remove('new')
    card.setAttribute('ondrop', "cardDropped(this, event)")
    card.innerHTML = `<div  class="content">${value}</div><i class="fas fa-info-circle info" onmouseenter="showInfo(this)" onmouseout="hideInfo(this)" data-id="${newRequestId}"></i>`;
    card.classList.add(priority)
    submitNewRequestButton.style.display = 'none';
    addNewRequestButton.style.removeProperty('display');
    fetchData(`/todo`, {
        method: "POST",
        headers: {
            authorization: accessToken,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: newRequestId,
            status: "request",
            title: value,
            description,
            by: userId,
            priority,
            team: lastActiveTeam
        })
    }).then(res => {
        if (res.status == "OKAY") {
            AllData.push({
                id: newRequestId,
                status: "request",
                title: value,
                description,
                by: userId,
                at: new Date(),
                priority,
                team: lastActiveTeam
            })
        }
    })

}

function checkNewRequestInputs() {
    let value = document.querySelector('.drop-card.new').querySelector(".new-request-input").value.toString().trim();
    let description = document.querySelector('.drop-card.new').querySelector(".new-request-desc").value.toString().trim();
    if (value.length > 30) {
        document.querySelector('.drop-card.new').querySelector(".new-request-input").style.border = `2px solid red`;
        submitNewRequestButton.classList.add('disabled');
        return;
    }
    document.querySelector('.drop-card.new').querySelector(".new-request-input").style.removeProperty('border')
    if (value.length == 0 || description.length == 0) {
        submitNewRequestButton.classList.add('disabled');
        return;
    }
    submitNewRequestButton.classList.remove('disabled');

}

const infoCard = document.querySelector(".info-card");
const infoCardContent = document.querySelector(".info-card").querySelector('.content');
const infoCardTags = document.querySelector(".info-card").querySelector('.tags')
const infoCardTagsBy = infoCardTags.querySelector("#by")
const infoCardTagsMoved = infoCardTags.querySelector("#movedby")

function showInfo(el) {
    let rect = el.getBoundingClientRect();
    let top = rect.top;
    let left = rect.left;
    infoCard.style.left = `${left + document.documentElement.scrollLeft + 10}px`;
    infoCard.style.top = `${top+document.documentElement.scrollTop+10}px`;
    infoCard.style.opacity = '1';
    let id = el.getAttribute('data-id');
    let dataElement = AllData.find(x => x.id == id);
    let desc = dataElement.description;
    let by = dataElement.by;
    let at = dataElement.at;
    let movedBy = dataElement.movedBy;
    infoCardContent.innerHTML = desc;
    infoCardTagsBy.innerHTML = `Requested by ${by} ${moment(at).fromNow()}`;
    if (movedBy) {
        infoCardTagsMoved.style.removeProperty('display');
        infoCardTagsMoved.innerHTML = `Moved By: ${movedBy}`;
    } else {
        infoCardTagsMoved.style.display = 'none';
    }


}

function hideInfo() {
    infoCard.style.opacity = "0";
}


function fetchTodo() {
    AllData = [];
    let team = teamListUL.querySelector('li.active').getAttribute('data-id');
    fetchData(`/todo?team=${team}`).then(res => {
        if (res.status == "OKAY") {
            let data = res.data;
            AllData = data;
            renderCards()
                // The mutation observer
            var ob = new MutationObserver(function() {
                classChanged(body);
            });
            ob.observe(body, {
                attributes: true,
                attributeFilter: ["class"]
            });
        }
    })
}

function cardDropped(el, event) {
    console.log(el);
    console.log(event)
}
const body = document.body;
// The function to call when the class changes
function classChanged(b) {

    if (b.classList.contains("gu-unselectable") || !b.classList.contains("submenu-closed")) {
        return;
    } else {
        if (!role) {
            role = memberships.find(x => x.user == userId).role;
        }
        if (role == 'client') {
            console.log('client')
            renderCards()
            return;
        }
        console.log("Dropped")
        let newData = [];
        requestCardContainer.querySelectorAll('.drop-card').forEach(card => {
            let id = card.querySelector('i').getAttribute('data-id');
            newData.push({
                id,
                status: "request",
                movedby: userId
            })
        })
        queueCardContainer.querySelectorAll('.drop-card').forEach(card => {
            let id = card.querySelector('i').getAttribute('data-id');
            newData.push({
                id,
                status: "queued",
                movedby: userId
            })
        })
        inProgressCardContainer.querySelectorAll('.drop-card').forEach(card => {
            let id = card.querySelector('i').getAttribute('data-id');
            newData.push({
                id,
                status: "wip",
                movedby: userId
            })
        })
        holdCardContainer.querySelectorAll('.drop-card').forEach(card => {
            let id = card.querySelector('i').getAttribute('data-id');
            newData.push({
                id,
                status: "hold"
            })
        })
        doneCardContainer.querySelectorAll('.drop-card').forEach(card => {
            let id = card.querySelector('i').getAttribute('data-id');
            newData.push({
                id,
                status: "done"
            })
        });
        let { changedElement, newStatus } = fetchChangedElement(newData);
        if (!changedElement || !newStatus) {
            return;
        }
        AllData.map((x) => {
            let obj = x;
            if (x.id == changedElement) {
                obj.status = newStatus;
            }
            return obj;
        });
        fetchData(`/todo`, {
            method: "PATCH",
            headers: {
                authorization: accessToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: changedElement,
                status: newStatus
            })
        }).then(res => {
            renderCards()
        })
    }
}


function fetchChangedElement(newData) {
    let obj = {}
    newData.forEach(d1 => {
        AllData.forEach(d2 => {
            if ((d1.id == d2.id) && (d1.status != d2.status)) {
                obj.changedElement = d1.id;
                obj.newStatus = d1.status
            }
        })
    });
    return obj;
}



function renderCards() {
    requestCardContainer.innerHTML = ``;
    queueCardContainer.innerHTML = ``;
    doneCardContainer.innerHTML = ``;
    inProgressCardContainer.innerHTML = ``;
    holdCardContainer.innerHTML = ``;
    AllData.forEach(el => {
        let newCard = document.createElement('div');
        if (el.status == 'request') {
            requestCardContainer.appendChild(newCard);
        } else if (el.status == 'queued') {
            queueCardContainer.appendChild(newCard);
        } else if (el.status == 'wip') {
            inProgressCardContainer.appendChild(newCard);
        } else if (el.status == 'done') {
            doneCardContainer.appendChild(newCard);
        } else if (el.status == 'hold') {
            holdCardContainer.appendChild(newCard);
        }
        newCard.classList.add('drop-card');
        newCard.setAttribute('ondrop', "cardDropped(this, event)")
        newCard.innerHTML = `<div class="content">${el.title}</div><i class="fas fa-info-circle info" onmouseenter="showInfo(this)" onmouseout="hideInfo(this)" data-id="${el.id}"></i>`;
        newCard.classList.add(el.priority);
    });
}