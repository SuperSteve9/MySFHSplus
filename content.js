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
        // RUN ALL CODE IN THIS FUNCTION PLEASE I BEG
        try {
            if (document.getElementById("gpa")) {
                processedForThisUrl = true;
                return;
            }

            // format is class name, grade, weighted
            let currentClassData = [];

            // other variables and sht
            let gpas = [];
            let gradeChanges = "";
            const row = getElementFromXPath('//*[@id="site-main"]/div/div/div/div[3]', document);
            const conductDIV = getElementFromXPath('//*[@id="conduct"]', document);

            // element where all of the elments for the classes are found
            const coursesContainer = getElementFromXPath('//*[@id="coursesContainer"]', document);

            // all stuff to do with grades
            for (const child of coursesContainer.children) {
                // name things
                let name = child.querySelector("h3").textContent;
                name = name.split(" - ")[0];

                // grade stuff
                let grade = child.querySelector(".showGrade").textContent.trim();
                grade = parseFloat(grade);
                if (isNaN(grade)) {
                    grade = null;
                }

                // weighted or not
                let weighted = false;
                if (name.startsWith("AP") || name.endsWith("-H")) {
                    weighted = true;
                }

                // gpa
                gpas.push(calcGPA(grade, weighted));

                // change
                console.log(grade);

                currentClassData.push({ class: name, grade: grade, weight: weighted});

                // modifications
                if (!isNaN(grade)) {
                    // actual modification
                    let textElement = child.querySelector(".showGrade");
                    if(!textElement.dataset.modified) {
                        textElement.textContent += "(" + getGradeLetter(grade) + ")";
                        textElement.dataset.modified = true;
                    }
                }
            }

            // data shit
            let oldData = JSON.parse(localStorage.getItem("data"));
            if (oldData === null) {
                oldData = currentClassData;
                localStorage.setItem("data", JSON.stringify(currentClassData));
            }

            const grades = currentClassData.map(entry => entry.grade);           
            const oldGrades = oldData.map(entry => entry.grade);

            if (!arraysEqual(grades, oldGrades)) {
                for (i = 0; i < grades.length; i++) {
                    if (grades[i] != oldGrades[i]) {
                        if (grades[i] >= oldGrades[i]) {
                            gradeChanges += currentClassData[i].class + ": " + oldGrades[i].toFixed(3) + " ↑ " + grades[i].toFixed(3) + "\n";
                        } else {
                            gradeChanges += currentClassData[i].class + ": " + oldGrades[i].toFixed(3) + " ↓ " + grades[i].toFixed(3) + "\n";
                        }
                    }
                }
            } else {
                gradeChanges = "No Grade Changes";
            }

            localStorage.setItem("data", JSON.stringify(currentClassData));

            // test to see arrays are correct
            console.log(currentClassData);
            console.log(gpas);
            console.log(calcCumGPA(gpas));

            // create GPA tile
            const gpaTile = createGPADIV(conductDIV, "GPA", (calcCumGPA(gpas)).toPrecision(3), "Current Weighted GPA", "gpa");
            gpaTile.id = "gpa";
            row.appendChild(gpaTile);

            console.log(grades);

            // create grade change tile
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
    console.log(count);
    var total = 0;
    for (i = 0; i < grades.length; i++) {
        if (grades[i] != null) {
            total += grades[i];
        }
    }
    console.log(total);

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

// prob gonna replace these but idk
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

// same as GPA
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

// i don't think i actually need this but i like it :) <3
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

// testing shit idrk
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

// stupid fucking arrays in js cant fucking work for fucking sake
function arraysEqual(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

