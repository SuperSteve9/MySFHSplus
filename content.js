// const body = document.querySelector("body");
// body.style.setProperty("background-color", "#252525");
function runOnDomChange() {
    let lastUrl = location.href;
    let processedForThisUrl = false;
    let running = false;

    // reset when spa changes url
    const _push = history.pushState;
    const _replace = history.replaceState;
    function markUrlChanged() {
        lastUrl = location.href;
        processedForThisUrl = false;
    }
    history.pushState = function () { _push.apply(this, arguments); markUrlChanged(); };
    history.replaceState = function () { _replace.apply(this, arguments); markUrlChanged(); };
    window.addEventListener("popstate", markUrlChanged);

    let tick = null;
    const schedule = (fn) => {
        clearTimeout(tick);
        tick = setTimeout(fn, 50); // kms
    };

    const observer = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            processedForThisUrl = false;
        }
        schedule(runOncePerUrl);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    function runOncePerUrl() {
        if (running || processedForThisUrl) return;

        const target = getElementFromXPath('//*[@id="coursesContainer"]/div[9]/div[4]/h3', document);
        if (!target) return;

        running = true;
        try {
            // if gpa already there don't touch it
            if (document.getElementById("gpa")) {
                processedForThisUrl = true;
                return;
            }
            if (localStorage.getItem("grades")) {
                let oldGrades = JSON.parse(localStorage.getItem("grades"));
            }
            const row = getElementFromXPath('//*[@id="site-main"]/div/div/div/div[3]', document);
            const conductDIV = getElementFromXPath('//*[@id="conduct"]', document);

            let gradesPA = [];
            let grades = [];
            const classesThing = getElementFromXPath('//*[@id="coursesContainer"]', document);
            let classes = [];

            for (const child of classesThing.children) {
                let name = child.querySelector("h3").textContent;
                name = name.split(" - ")[0];
                let grade = child.querySelector(".showGrade").textContent.trim();
                let gradeLetter = null;

                classes.push(name);


                if (grade == "--") {
                    grade = "no grade value";
                    if (name !== "Homeroom") {
                        grades.push(null);
                        gradesPA.push(null);
                    }
                } else {
                    grade = parseFloat(grade);
                    grades.push(grade);
                    gradeLetter = getGradeLetter(grade);
                }

                if (name.startsWith("AP") || name.endsWith("-H")) {
                    if (!isNaN(grade)) {
                        gradesPA.push(calcGPA(grade, true));
                        let textElm = child.querySelector(".showGrade");
                        if (!textElm.dataset.modified) {
                            textElm.textContent += "(" + gradeLetter + ")";
                            textElm.dataset.modified = true;
                        }
                    }
                } else if (name !== "Homeroom") {
                    if (!isNaN(grade)) {
                        gradesPA.push(calcGPA(grade, false));
                        let textElm = child.querySelector(".showGrade");
                        if (!textElm.dataset.modified) {
                            textElm.textContent += "(" + gradeLetter + ")";
                            textElm.dataset.modified = true;
                        }
                    }
                }
            }

            let gradeChanges = "";
            if (!arraysEqual(grades, oldGrades)) {
                for (i = 0; i < grades.length; i++) {
                    if (grades[i] != oldGrades[i]) {
                        if (grades[i] >= oldGrades[i]) {
                            gradeChanges += classes[i] + ": " + oldGrades[i].toPrecision(3) + " ↑ " + grades[i].toPrecision(3) + "\n";
                        } else {
                            gradeChanges += classes[i] + ": " + oldGrades[i].toPrecision(3) + " ↓ " + grades[i].toPrecision(3) + "\n";
                        }
                    }
                }
            }

                if (gradeChanges === "") {
                    gradeChanges = ("No grade changes.");
                }
            

            console.log(grades);
            console.log(gradesPA);
            const GPA = calcCumGPA(gradesPA);
            console.log(GPA);

            localStorage.setItem("grades", JSON.stringify(grades));

            const gpaTile = createGPADIV(conductDIV, "GPA", GPA.toPrecision(3), "Current Weighted GPA", "gpa");
            gpaTile.id = "gpa";
            row.appendChild(gpaTile);

            const gradeChangeTile = createGradeChangeDIV(conductDIV, "Grade Changes", gradeChanges, "gradeChanges");
            gradeChangeTile.id = "gradeChanges";
            row.appendChild(gradeChangeTile);

            processedForThisUrl = true;
        } finally {
            running = false;
        }
    }

    schedule(runOncePerUrl); // run once on load if target already exists
}

runOnDomChange();



// ACTIVE FUNCTIONS



// HELPER FUNCTIONS


// calculate GPA per class
// bro tf is this GPA calculation maybe idk but this seems kinda stupid
function calcGPA(grade, Weighted) {
    var gpa;
    if (grade >= 70 && grade < 76) {
        // point in value bracket kinda like taxes but for grades
        var piv = grade - 70;
        gpa = (((2.00 - 1.00) / 6) * piv) + 1.00;
    } else if (grade >= 76 && grade < 85) {
        var piv = grade - 76;
        gpa = (((3.00 - 2.00) / 9) * piv) + 2.00;
    } else if (grade >= 85 && grade < 93) {
        var piv = grade - 85;
        gpa = (((4.00 - 3.00) / 8) * piv) + 3.00;
    } else if (grade >= 93) {
        var piv = grade - 93;
        gpa = (((4.86 - 4.00) / 7) * piv) + 4.00;
    }

    if (Weighted) {
        gpa += 1;
    }

    return gpa;
}

// calculate cumulative GPA
// i don't even know how this works if im even doing it correctly but i guess ill see
function calcCumGPA(grades) {
    let count = 0;
    for (i = 0; i < grades.length; i++) {
        if (grades[i] != null) {
            count++;
        }
    }
    var total = 0;
    for (i = 0; i < grades.length; i++) {
        total += grades[i];
    }

    var cumGPA = total / count;
    return cumGPA;
}

// thing to get the letter grade cause thats important cause oncampus+ used it so i gotta
// I also forgot the grading scale for - and + used in oc+ so im just gonna have to guess
// also who tf getting less than a 70 in a class :skull:
function getGradeLetter(grade) {
    switch (true) {
        case (grade >= 97):
            return 'A+';
        case (grade >= 95):
            return 'A';
        case (grade >= 93):
            return 'A-';
        case (grade >= 90):
            return 'B+';
        case (grade >= 87):
            return 'B';
        case (grade >= 85):
            return 'B-';
        case (grade >= 83):
            return 'C+';
        case (grade >= 79):
            return 'C';
        case (grade >= 76):
            return 'C-';
        case (grade >= 74):
            return 'D+';
        case (grade >= 72):
            return 'D';
        case (grade >= 70):
            return 'D-';
        default:
            return 'F';
    }
}

function createGPADIV(target, title, maintext, subtext, intname) {
    const cleanedDIV = target.cloneNode(true);
    cleanedDIV.id = intname;
    const Title = cleanedDIV.querySelector(".bb-tile-header");
    Title.textContent = title;
    const mainTextParent = cleanedDIV.querySelector("a");
    const mainText = mainTextParent.querySelector("h1");
    mainTextParent.parentNode.insertBefore(mainText, mainTextParent);
    mainTextParent.remove();
    mainText.textContent = maintext;
    const subText = cleanedDIV.querySelector(".muted h5")
    subText.textContent = subtext;
    const collapseOBJ = cleanedDIV.querySelector("#conductCollapse");
    collapseOBJ.id = intname + "Collapse";
    const otherCollapseOBJ = cleanedDIV.querySelector(".bb-tile-title");
    otherCollapseOBJ.setAttribute("data-target", "#" + intname + "Collapse");
    return cleanedDIV;
}

function createGradeChangeDIV(target, title, Stext, intname) {
    const cleanedDIV = target.cloneNode(true);
    cleanedDIV.id = intname;
    const Title = cleanedDIV.querySelector(".bb-tile-header");
    Title.textContent = title;
    const mainTextParent = cleanedDIV.querySelector("a");
    mainTextParent.remove();
    const subText = cleanedDIV.querySelector(".muted h5")
    subText.style.whiteSpace = "pre-line";
    subText.textContent = Stext;
    const collapseOBJ = cleanedDIV.querySelector("#conductCollapse");
    collapseOBJ.id = intname + "Collapse";
    const otherCollapseOBJ = cleanedDIV.querySelector(".bb-tile-title");
    otherCollapseOBJ.setAttribute("data-target", "#" + intname + "Collapse");
    return cleanedDIV;
}

function getElementFromXPath(XPath, document) {
    const obj = document.evaluate(
        XPath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
    ).singleNodeValue;

    return obj;
}

function createBanner(text, document) {
    const banner = document.createElement("div");
    banner.textContent = text;
    banner.style = `
        position: fixed;
        top: 0;
        width: 100%;
        padding: 5px;
        background: black;
        color: white;
        text-align: center;
        z-index: 9999;
    `;

    document.body.appendChild(banner);
}

function arraysEqual(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}
