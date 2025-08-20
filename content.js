// const body = document.querySelector("body");
// body.style.setProperty("background-color", "#252525");
const observer = new MutationObserver(() => {
    // deep ass element to wait for observer
    const target = getElementFromXPath('//*[@id="coursesContainer"]/div[9]/div[4]/h3', document);

    if (target) {
        observer.disconnect();
        createBanner("MYSFHS+ DEVELOPMENT VERSION 2.5.10 DO NOT DISTRIBUTE", document);
        const row = getElementFromXPath('//*[@id="site-main"]/div/div/div/div[3]', document);
        const conductDIV = getElementFromXPath('//*[@id="conduct"]', document);

        let grades = [];

        const classes = getElementFromXPath('//*[@id="coursesContainer"]', document);
        for (const child of classes.children) {
            let name = child.querySelector("h3").textContent;
            name = name.split(" - ")[0];
            let grade = child.querySelector(".showGrade").textContent;
            grade = grade.trim();
            let gradeLetter = null;
            if (grade == "--") {
                grade = "no grade value";
            } else {
                grade = parseFloat(grade);
                gradeLetter = getGradeLetter(grade);
            }
            if (name.startsWith("AP") || name.endsWith("-H")) {
                console.log(name + " is weighted with grade " + grade);
                if(!isNaN(grade)) {
                    grades.push(calcGPA(grade, true));
                    let textElm = child.querySelector(".showGrade");
                    textElm.textContent += "(" + gradeLetter + ")";
                    textElm.dataset.modified = true;           
                }
            } else if (name == "Homeroom") {
                console.log("thats homeroom ignore ts");
            } else {
                console.log(name + " is not weighted with grade " + grade);
                if(!isNaN(grade)) {
                    grades.push(calcGPA(grade, false));
                    let textElm = child.querySelector(".showGrade");
                    textElm.textContent += "(" + gradeLetter + ")";
                    textElm.dataset.modified = true;
                }
            }



        }

        console.log(grades);
        const GPA = calcCumGPA(grades);
        console.log(GPA);

        const gpaTile = createDIV(conductDIV, "GPA", GPA.toPrecision(3), "", "gpa");
        row.appendChild(gpaTile);
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
});

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
    var count = grades.length;
    var total = 0;
    for (i=0; i<grades.length; i++) {
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

function createDIV(target, title, maintext, subtext, intname) {
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