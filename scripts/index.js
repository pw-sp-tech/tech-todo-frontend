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
document.querySelector('.user-name2').innerHTML = userName;
const baseURL = `https://tech-todo-backend.herokuapp.com`;
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
    } else if (teamListUL.querySelector(`li[data-id="${lastActiveTeam}"]`)) {
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
    card.innerHTML = `<div  class="content">${value}</div><i class="fas fa-info-circle info" onmouseenter="showInfo(this)" onmouseout="hideInfo(this)" data-id="${newRequestId}"></i><div class="preloader pl-size-xs loader-card" data-id="${newRequestId}">
                                    <div class="spinner-layer pl-white">
                                        <div class="circle-clipper left">
                                            <div class="circle"></div>
                                        </div>
                                        <div class="circle-clipper right">
                                            <div class="circle"></div>
                                        </div>
                                    </div>
                                </div>`;
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
            document.querySelector(`.loader-card[data-id="${newRequestId}"]`).remove()
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
    let by, movedBy;
    if (dataElement.requestedby) {
        by = memberships.find(x => x.user == dataElement.requestedby).name;
    }
    if (dataElement.movedby) {
        movedBy = memberships.find(x => x.user == dataElement.movedby).name;
    }
    let at = dataElement.at;

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


function fetchTodo(teamParam) {
    AllData = [];
    let team;
    if (!teamParam) {
        team = teamListUL.querySelector('li.active').getAttribute('data-id');
    } else {
        team = teamParam
    }

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
let dropping = 0;
// The function to call when the class changes
function classChanged(b) {

    if (b.classList.contains("gu-unselectable")) {
        dropping = 1;
        console.log(dropping)
        return;
    }
    if (b.classList.contains("gu-unselectable") || !b.classList.contains("submenu-closed") || dropping == 0) {
        console.log(dropping)
        return;
    } else {
        console.log(dropping)
        dropping = 0;
        if (!role) {
            let match = memberships.find(x => x.user == userId)
            if (match) {
                role = match.role;
            }
        }
        if (role == 'client' || !role) {
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
                status: "hold",
                movedby: userId
            })
        })
        doneCardContainer.querySelectorAll('.drop-card').forEach(card => {
            let id = card.querySelector('i').getAttribute('data-id');
            newData.push({
                id,
                status: "done",
                movedby: userId
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
                obj.movedby = userId
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
                status: newStatus,
                movedby: userId
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
    AllData.sort(compare)
    requestCardContainer.innerHTML = ``;
    queueCardContainer.innerHTML = ``;
    doneCardContainer.innerHTML = ``;
    inProgressCardContainer.innerHTML = ``;
    holdCardContainer.innerHTML = ``;
    AllData.forEach(el => {
        let newCard = document.createElement('div');
        if (el.status == 'request') {
            requestCardContainer.appendChild(newCard);
            newCard.classList.add(el.priority);
        } else if (el.status == 'queued') {
            queueCardContainer.appendChild(newCard);
            newCard.classList.add(el.priority);
        } else if (el.status == 'wip') {
            inProgressCardContainer.appendChild(newCard);
            newCard.classList.add(el.priority);
        } else if (el.status == 'done') {
            doneCardContainer.appendChild(newCard);
            newCard.classList.add("done");
        } else if (el.status == 'hold') {
            holdCardContainer.appendChild(newCard);
            newCard.classList.add(el.priority);
        }
        newCard.classList.add('drop-card');
        newCard.setAttribute('ondrop', "cardDropped(this, event)")
        newCard.innerHTML = `<div class="content">${el.title}</div><i class="fas fa-info-circle info" onmouseenter="showInfo(this)" onmouseout="hideInfo(this)" data-id="${el.id}"></i>`;

    });
}


function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    window.location.href = 'login-register.html'
}

function switchTeam(team) {
    localStorage.setItem('active_team', team)
    AllData = [];
    teamListUL.querySelectorAll('li').forEach(el => {
        el.classList.remove('active')
    })
    teamListUL.querySelector(`li[data-id="${team}"]`).classList.add('active')
    fetchTodo(team)
}

function compare(b, a) {
    if ((a.priority == 'low' && b.priority == 'medium') || (a.priority == 'medium' && b.priority == 'high')) {
        return -1;
    }
    if ((a.priority == 'medium' && b.priority == 'low') || (a.priority == 'high' && b.priority == 'medium')) {
        return 1;
    }
    return 0;
}