console.log('%cGet out of here and focus in class! ', 'color: #FF0000');

(function () {
  let observer;
  let gradeElems = [];
  let weightedElems = [];
  let baseTile;
  let gpas = [];
  let grades = [];
  let classes = [];

  function main() {
    gradeElems.length = 0;
    weightedElems.length = 0;
    classes.length = 0;
    document.querySelectorAll('#app #coursesContainer .row').forEach(row => {
      let gradeElem = row.querySelector('.col-md-2 h3.showGrade');
      if (gradeElems.indexOf(gradeElem) === -1) {
        gradeElems.push(gradeElem);
      }
      let weightedElem = row.querySelector('.col-md-3 a');
      if (weightedElems.indexOf(weightedElem) === -1) {
        weightedElems.push(weightedElem);
      }
      let classElem = row.querySelector('.col-md-3 a h3');
      classes.push(classElem.textContent);
    });

    if (gradeElems.length === 9) {
      baseTile = document.getElementById('conduct');
      observer.disconnect();
      afterObserverCallback();
    }
  }

  function afterObserverCallback() {
    appendGrades(gradeElems, gpas, weightedElems, grades);
    createGPATile(baseTile, gpas);
    createChangeTile(baseTile, grades, classes);
    createStyleTile(baseTile);
  }

  function observeElement(selector) {
    // Disconnect any existing observer
    if (observer) {
      observer.disconnect();
    }

    const targetNode = document.documentElement;

    // Create a new observer instance each time
    observer = new MutationObserver((mutations, obs) => {
      if (document.querySelector(selector)) {
        main();
      }
    });

    observer.observe(targetNode, {
      childList: true,
      subtree: true
    });
  }


  // SPA URL change handling
  (function (history) {
    const pushState = history.pushState;
    const replaceState = history.replaceState;
    history.pushState = function () {
      const result = pushState.apply(history, arguments);
      window.dispatchEvent(new Event('locationchange'));
      return result;
    };
    history.replaceState = function () {
      const result = replaceState.apply(history, arguments);
      window.dispatchEvent(new Event('locationchange'));
      return result;
    };
    window.addEventListener('popstate', function () {
      window.dispatchEvent(new Event('locationchange'));
    });
  })(window.history);

  window.addEventListener('locationchange', function () {
    console.log("URL change detected");
    observeElement('#app');
  });

  // Initial observer
  observeElement('#app');
})();

/* <------------------- ACTION METHODDS ----------------> */

// append grade letters to each grade
function appendGrades(gradeElems, gpas, weightedElems, grades) {
  for (let i = 0; i < gradeElems.length; i++) {
    let elem = gradeElems[i];
    let weightedElem = weightedElems[i];
    let grade = parseFloat(elem.textContent);
    grades.push(grade);
    if (!isNaN(grade)) {
      elem.textContent += (`(${getGradeLetter(grade)})`);
      let classID = weightedElem.getAttribute('href');
      let weighted = false;
      classID = classID.replace('#academicclass/', '');
      classID = classID.replace('/undefined/bulletinboard', '');
      if (classID.substring(0, 3) == '976') {
        weighted = true;
      } else if (classID.substring(0, 3) == '977') {
        weighted = false;
      }
      gpas.push(calcGPA(grade, weighted));
      if (getGradeLetter(grade) === 'F') {
        elem.style.color = "red";
      }
    }
  }
}

// Create the GPA tile block
function createGPATile(baseTile, gpas) {
  let GPATile = baseTile.cloneNode(true);
  GPATile.id = 'GPA';

  let title = GPATile.querySelector('h2.bb-tile-header');
  title.textContent = 'GPA';

  let desc = GPATile.querySelector('h5');
  desc.textContent = "Current Weighted GPA";

  $(GPATile).find('.col-md-12 div a h1').unwrap();
  let GPA = GPATile.querySelector('.col-md-12 h1');
  GPA.textContent = Math.trunc(calcGPAAvg(gpas) * 100) / 100;

  let dataAtt = GPATile.querySelector('.bb-tile-title');
  dataAtt.setAttribute('data-target', '#GPACollapse');

  let seperAtt = GPATile.querySelector('#conductCollapse');
  seperAtt.setAttribute('id', 'GPACollapse');

  baseTile.parentNode.appendChild(GPATile);
}

function createStyleTile(baseTile) {
  let styleTile = baseTile.cloneNode(true);
  styleTile.id = 'style';

  let title = styleTile.querySelector('h2.bb-tile-header');
  title.textContent = 'Colors';

  $(styleTile).find(".col-md-12 div a h1").remove();
  $(styleTile).find(".muted").remove();

  let styleContainer = styleTile.querySelector('.col-md-12');
  styleContainer.innerHTML = '';

  let topBar = document.createElement('input');
  topBar.type = 'color';
  topBar.value = '#004a97';
  styleContainer.appendChild(topBar);


  topBar.addEventListener('input', (event) => {
    changeColorTopBar(event.target.value);
  });

  let middleBar = document.createElement('input');
  middleBar.type = 'color';
  middleBar.value = '#e8f3fc';
  styleContainer.appendChild(middleBar);


  middleBar.addEventListener('input', (event) => {
    changeColorMiddleBar(event.target.value);
  });
  
  let lowerBar = document.createElement('input');
  lowerBar.type = 'color';
  lowerBar.value = '#e8f3fc';
  styleContainer.appendChild(lowerBar);


  lowerBar.addEventListener('input', (event) => {
    changeColorLowerBar(event.target.value);
  });

  let body = document.createElement('input');
  body.type = 'color';
  body.value = '#eeeeef';
  styleContainer.appendChild(body);


  body.addEventListener('input', (event) => {
    changeColorBody(event.target.value);
  });

  let tileTitle = document.createElement('input');
  tileTitle.type = 'color';
  tileTitle.value = '#ffffff';
  styleContainer.appendChild(tileTitle);


  tileTitle.addEventListener('input', (event) => {
    changeColorTileTitle(event.target.value);
  });

  let tileBG = document.createElement('input');
  tileBG.type = 'color';
  tileBG.value = '#ffffff';
  styleContainer.appendChild(tileBG);


  tileBG.addEventListener('input', (event) => {
    changeColorTilebg(event.target.value);
  });


  let dataAtt = styleTile.querySelector('.bb-tile-title');
  dataAtt.setAttribute('data-target', '#styleCollapse');

  let seperAtt = styleTile.querySelector('#conductCollapse');
  seperAtt.setAttribute('id', 'styleCollapse');

  baseTile.parentNode.appendChild(styleTile);
}


// Create the Grade Change tile block
function createChangeTile(baseTile, grades, classes) {
  const savedGrades = JSON.parse(localStorage.getItem('grades'));
  localStorage.setItem('grades', JSON.stringify(grades));
  let GCTile = baseTile.cloneNode(true);
  GCTile.id = 'GradeChange';

  let title = GCTile.querySelector('h2.bb-tile-header');
  title.textContent = 'Grade Changes';

  let desc = GCTile.querySelector('h5');
  desc.textContent = "No Grade Changes";

  $(GCTile).find(".col-md-12 div a h1").wrap('<h5></h5>').parent().contents().unwrap();
  $(GCTile).find(".col-md-12 div a h1").remove();

  let GCContainer = GCTile.querySelector('.col-md-12');
  GCContainer.innerHTML = '';

  let gradeChangeTexts = [];

  for (i = 0; i < savedGrades.length; i++) {
    if (grades[i] > savedGrades[i]) {
      gradeChangeTexts.push(`<span style="color: green;">${classes[i]}: ${savedGrades[i]} ↑ ${grades[i]}</span>`);
    } else if (grades[i] < savedGrades[i]) {
      gradeChangeTexts.push(`<span style="color: red;">${classes[i]}: ${savedGrades[i]} ↓ ${grades[i]}</span>`);
    } else {
      gradeChangeTexts.push(0);
    }
  }

  if (gradeChangeTexts.every(text => text === 0)) {
    let gradeElem = document.createElement('h5');
    gradeElem.textContent = "No grade changes.";
    GCContainer.appendChild(gradeElem);
  } else {
    for (const text of gradeChangeTexts) {
      if (text != 0) {
        let gradeElem = document.createElement('h5');
        gradeElem.innerHTML = text;
        GCContainer.appendChild(gradeElem);
      }
    }
  }

  let dataAtt = GCTile.querySelector('.bb-tile-title');
  dataAtt.setAttribute('data-target', '#GCCollapse');

  let seperAtt = GCTile.querySelector('#conductCollapse');
  seperAtt.setAttribute('id', 'GCCollapse');

  baseTile.parentNode.appendChild(GCTile);
}

/* extremly unoptimized color changer WILL FIX LATER PLEASE*/

function changeColorTopBar(color) {
  const top = document.querySelector('.pri-100-bgc');
  top.style.setProperty('background-color', color, 'important');
}

function changeColorMiddleBar(color) {
  const top = document.querySelector('.sec-15-bgc');
  top.style.setProperty('background-color', color, 'important');
}

function changeColorLowerBar(color) {
  const top = document.querySelector('.subnavbar');
  top.style.setProperty('background-color', color, 'important');
}

function changeColorBody(color) {
  const top = document.querySelector('body');
  top.style.setProperty('background-color', color, 'important');
}

function changeColorTileTitle(color) {
  const top = document.querySelectorAll('.bb-tile .bb-tile-title');
  top.forEach(el => {
    el.style.setProperty('background-color', color, 'important');
  })
}

function changeColorTilebg(color) {
  const top = document.querySelectorAll('.bb-tile-content');
  top.forEach(el => {
    el.style.setProperty('background-color', color, 'important');
  })
}
/* <----------------- HELPER FUNCTIONS -----------------> */

// convert grade number to grade letter
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

// take a class and weightedness and spit a gpa number out
function calcGPA(grade, Weighted) {
  var gpa;
  if (grade < 70) {
    return 1;
  } else if (grade >= 70 && grade < 76) {
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
  console.log(gpa);

  return gpa;
}

// Calculates the GPA from the GPs
function calcGPAAvg(gpas) {
  let sum = 0;
  for (const gpa of gpas) {
    console.log(gpa);
    sum += gpa;
    console.log(sum);
  }
  sum /= gpas.length;

  console.log(sum);
  return sum;
}
