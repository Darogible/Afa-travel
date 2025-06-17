// change language
const langToggle = document.getElementById('lang-toggle');
const langMenu = document.getElementById('lang-menu');

if (langToggle && langMenu) {
  langToggle.addEventListener('click', () => {
    langMenu.classList.toggle('visually-hidden');

    // Close the burger menu if it is open
    if (!mobileMenu.classList.contains('visually-hidden')) {
      mobileMenu.classList.add('visually-hidden');
      burgerButton.textContent = '☰';
      navBackground.classList.remove('nav--active');
    }
  });
}

let lastScrollLang = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    if (!langMenu.classList.contains('visually-hidden')) {
        // user scrolls down
        if (currentScroll > lastScrollLang) {
            // close menu
            langMenu.classList.add('visually-hidden');
            navBackground.classList.remove('nav--active');
        }
    }
    lastScrollLang = currentScroll;
});


/* mobile burger menu */
const burgerButton = document.getElementById('burger-button');
const mobileMenu = document.getElementById('mobile-menu');
const navBackground = document.querySelector('.nav');

if (burgerButton && mobileMenu && navBackground) {
  burgerButton.addEventListener('click', () => {
    mobileMenu.classList.toggle('visually-hidden');

    // Close the language menu if it is open
    if (!langMenu.classList.contains('visually-hidden')) {
      langMenu.classList.add('visually-hidden');
    }

    // change the icon on the button
    if (burgerButton.textContent === '☰') {
      burgerButton.textContent = '✖';
    } else {
      burgerButton.textContent = '☰';
    }

    // add/remove active background from header
    navBackground.classList.toggle('nav--active');
  });
}

// burger menu automatically closes when scrolling
let lastScrollTop = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    // if menu is open
    if (mobileMenu && !mobileMenu.classList.contains('visually-hidden')) {
        // user scrolls down
        if (currentScroll > lastScrollTop) {
            // close menu
            mobileMenu.classList.add('visually-hidden');
            burgerButton.textContent = '☰'; // back icon
            navBackground.classList.remove('nav--active');
        }
    }

    lastScrollTop = currentScroll;
});


const currentLangDisplay = document.getElementById('current-lang');
const langItems = document.querySelectorAll('#lang-menu li');
const savedLang = localStorage.getItem('lang');
langItems.forEach(item => {
    item.addEventListener('click', () => {
        const selectedLang = item.getAttribute('data-lang');
        // console.log('Language selected:', selectedLang);
        localStorage.setItem('lang', selectedLang);
        currentLangDisplay.textContent = selectedLang.toUpperCase();
        langMenu.classList.toggle('visually-hidden');
        loadLanguage(selectedLang);
        //location.reload();
    });
});

let translations = {}; // global variable for current translations

const defaultLang = savedLang || 'en';
if (currentLangDisplay) {
  currentLangDisplay.textContent = defaultLang.toUpperCase();
}
loadLanguage(defaultLang);

function loadLanguage(lang) {
  // console.log('Loading language:', lang);

  fetch(`./lang/${lang}.json`)
    .then(response => response.json())
    .then(data => {
      //console.log('Translations uploaded:', data);
      translations = data; // save to global variable

      // Translation of elements with data-i18n
      const elements = document.querySelectorAll('[data-i18n]');
      elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (data[key]) {
          el.textContent = data[key];
        }
      });

      //  Translation of placeholder with data-i18n-placeholder
      const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
      placeholders.forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (data[key]) {
          el.placeholder = data[key];
        }
      });

      // Update values in inputs if keys are already selected
      if (countryInput && countryInput.dataset.countryKey) {
        const originalCountry = countryInput.dataset.countryKey;
        countryInput.value = translations[originalCountry] || originalCountry;
      }

      if (citiesInput && selectedCityKey) {
        citiesInput.value = translations[selectedCityKey] || selectedCityKey;
      }

      // Redraw countries and cities with translations if already loaded
      if (typeof renderCountryList === 'function' && allCountries.length > 0) {
        renderCountryList(allCountries);
      }

      if (typeof renderCityList === 'function' && Object.keys(allCities).length > 0) {
        let selectedCountry = countryInput.value;
        let cities = [];

        if (selectedCountry && allCities[selectedCountry]) {
          cities = allCities[selectedCountry];
        } else {
          for (let key in allCities) {
            cities = cities.concat(allCities[key]);
          }
        }

        cities.sort((a, b) => a.localeCompare(b));
        renderCityList(cities);
      }

      if (typeof renderFavoriteCitiesList === 'function') {
        renderFavoriteCitiesList();
        updateCountryCity();
      }
    })

    .catch(error => {
      console.error('Error loading translation:', error);
    });
}


function capitalizeWords(str) {
  return str.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}




/*                            */
/* country and city selection */
/*                            */

let selectedCountryKey = '';
let selectedCityKey = '';

// opening and closing country selection
const countryInput = document.getElementById('country-input');
const countryDropdown = document.getElementById('country-dropdown');
const countrySearchInput = document.getElementById('country-search-input');
const closeCountrySearch = document.querySelector('.close-country-search');

// Select country in search
let allCountries = [];

/* test */
if (countryInput && countryDropdown && countrySearchInput) {
    inputCountry();
}

// Universal function for city and country to close search when clicking outside
function handleClickOutside(dropdownId, inputId, close) {
    return function(event) {
        const dropdown = document.getElementById(dropdownId);
        const input    = document.getElementById(inputId);

        if (
            dropdown &&
            !dropdown.contains(event.target) &&
            input &&
            !input.contains(event.target)
        ) {
            close();
        }
    };
}


// Desktop positioning for country search
(function setupDesktopCountryOverlay() {
    const BREAKPOINT = 1024;
    const searchWrapper = document.querySelector('.country-search-input');
    const dropdown      = countryDropdown; // id = 'country-dropdown'
    const searchInput   = countrySearchInput // id = 'country-search-input'
    const closeButton      = document.getElementById('close-country-search');

    if (!countryInput || !searchWrapper || !dropdown) return;

    let opened = false;

    let clickOutside = handleClickOutside('country-dropdown', 'country-input', closeDesktopDropdown);
    document.addEventListener('click', clickOutside);

    function syncPosition() {
        if (!opened || window.innerWidth < BREAKPOINT) return;

        // getBoundingClientRect is built-in method of any DOM element, returns coordinates
        const rect = countryInput.getBoundingClientRect();

        // Position input on top of "countryInput"
        searchWrapper.style.top    = `${rect.top}px`;
        searchWrapper.style.left   = `${rect.left}px`;
        searchWrapper.style.width  = `${rect.width}px`;
        searchWrapper.style.height = `${rect.height}px`;

        // Position 'country-list' under the input
        const list = document.getElementById('country-list');
        if (list) {
            list.style.position = 'fixed';
            list.style.left = `${rect.left}px`;
            list.style.top = `${rect.top + rect.height}px`;
            list.style.width = `${rect.width}px`;
        }
    }

    function openDesktopDropdown() {
        if (window.innerWidth < BREAKPOINT) return;
        dropdown.classList.remove('visually-hidden');
        opened = true;

        document.addEventListener('click', handleClickOutside);

        syncPosition();
        window.addEventListener('scroll',  syncPosition);
        window.addEventListener('resize',  syncPosition);
        setTimeout(() => searchInput.focus(), 10);
    }

    function closeDesktopDropdown() {
        dropdown.classList.add('visually-hidden');
        opened = false;

        // web won't do extra work
        window.removeEventListener('scroll',  syncPosition);
        window.removeEventListener('resize',  syncPosition);
        document.removeEventListener('click', handleClickOutside); // Preventing memory leaks
    }

    countryInput.addEventListener('click', openDesktopDropdown);
    if (closeButton) closeButton.addEventListener('click', closeDesktopDropdown);
})();

function renderCountryList(countries) {
    const list = document.getElementById('country-list');
    if (!list) return; // If there is no element, we exit immediately
    list.innerHTML = ''; // clear the old

    countries.forEach(country => {
        const li = document.createElement('li');
        li.textContent = translations[country] || country;

        li.addEventListener('click', () => {
            selectedCountryKey = country;
            console.log("test 5: " + selectedCountryKey);
            // Show the translation to the user
            countryInput.value = translations[country] || country;
            // Store the original country name in the data attribute
            countryInput.dataset.countryKey = country;
            // Reset the search bar
            countrySearchInput.value = "";
            // Reset filtered list
            renderCountryList(allCountries);
            // Cleaning up the city
            document.getElementById("city-input").value = "";

            countryDropdown.classList.add('visually-hidden');
            document.documentElement.classList.remove('no-scroll');
        });

        list.appendChild(li);
    });
}


function inputCountry() {
    if (countryInput && countryDropdown && countrySearchInput) {
      countryInput.addEventListener('click', () => {
      countryDropdown.classList.remove('visually-hidden');
      //document.documentElement.classList.add('no-scroll');
      if (window.matchMedia('(max-width: 1023px)').matches) {
          document.documentElement.classList.add('no-scroll');
      }
      setTimeout(() => {
          countrySearchInput.focus();
      }, 10);

      });
    }

    if (closeCountrySearch) {
      closeCountrySearch.addEventListener('click', () => {
        const dropdown = document.getElementById('country-dropdown');
        if (dropdown) dropdown.classList.add('visually-hidden');
        document.documentElement.classList.remove('no-scroll');
      });
    }



    fetch('./data/locations.json')
      // .then(response => response.json()) // first I did it like this, but it's not very good, need to check for file upload
      .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load file: ' + response.status);
      }
      return response.json();
      })

      .then(data => {
        allCountries = data.countries;
        const sortedCountries = allCountries.slice().sort((a, b) => a.localeCompare(b));
        console.log(sortedCountries);
        renderCountryList(sortedCountries);
      });




    /*
      function renderCountryList(countries) {
        const list = document.getElementById('country-list');
        if (!list) return; // If there is no element, we exit immediately
        list.innerHTML = ''; // clear the old

        countries.forEach(country => {
          const li = document.createElement('li');
          li.textContent = translations[country] || country;

          li.addEventListener('click', () => {
            selectedCountryKey = country;
            console.log("test 5: " + selectedCountryKey);
            // Show the translation to the user
            countryInput.value = translations[country] || country;
            // Store the original country name in the data attribute
            countryInput.dataset.countryKey = country;
            // Reset the search bar
            countrySearchInput.value = "";
            // Reset filtered list
            renderCountryList(allCountries);
            // Cleaning up the city
            document.getElementById("city-input").value = "";

            countryDropdown.classList.add('visually-hidden');
            document.documentElement.classList.remove('no-scroll');
          });

          list.appendChild(li);
        });
      }
*/

      if (countrySearchInput) {
        countrySearchInput.addEventListener('input', () => {
          const searchValue = countrySearchInput.value.trim().toLowerCase();
          const filtered = allCountries.filter(c =>
            (translations[c] || c).toLowerCase().startsWith(searchValue)
          );
          renderCountryList(filtered);
        });
      }

      // opening and closing the keyboard on mobile phones
      if (countryInput && countryDropdown && countrySearchInput) {
        countryInput.addEventListener('click', () => {
          countryDropdown.classList.remove('visually-hidden');
          setTimeout(() => {
            countrySearchInput.focus(); // keyboard appears
          }, 10);
        });
      }

      if (closeCountrySearch && countryDropdown && countrySearchInput) {
        closeCountrySearch.addEventListener('click', () => {
          countryDropdown.classList.add('visually-hidden');
          countrySearchInput.blur(); // hide keyboard
        });
      }
}





// opening and closing cities selection
const citiesInput = document.getElementById('city-input');
const citiesDropdown = document.getElementById('cities-dropdown');
const citiesSearchInput = document.getElementById('cities-search-input');
const closeCitiesSearch = document.querySelector('.close-cities-search');

if (countryInput && countryDropdown && countrySearchInput) {
    inputCity();
}

// ─── Desktop positioning for city search ───
(function setupDesktopCityOverlay() {
    const BREAKPOINT = 1024;
    const searchWrapper = document.querySelector('.cities-search-input');
    const dropdown      = citiesDropdown;                                  // id = 'cities-dropdown'
    const searchInput   = citiesSearchInput;                               // id = 'cities-search-input'
    const closeButton   = document.getElementById('close-cities-search');
    const cityInputBox  = document.getElementById('city-input');

    if (!cityInputBox || !searchWrapper || !dropdown) return;

    let opened = false;

    let clickOutside = handleClickOutside('cities-dropdown', 'city-input', closeDesktopDropdown);
    document.addEventListener('click', clickOutside);

    function syncPosition() {
        if (!opened || window.innerWidth < BREAKPOINT) return;

        const rect = cityInputBox.getBoundingClientRect();

        // overlay the search input on top of #city-input
        searchWrapper.style.top    = `${rect.top}px`;
        searchWrapper.style.left   = `${rect.left}px`;
        searchWrapper.style.width  = `${rect.width}px`;
        searchWrapper.style.height = `${rect.height}px`;

        // position ul cities-list right below the input
        const list = document.getElementById('cities-list');
        if (list) {
            list.style.position = 'fixed';
            list.style.left  = `${rect.left}px`;
            list.style.top   = `${rect.top + rect.height}px`;
            list.style.width = `${rect.width}px`;
        }
    }

    function openDesktopDropdown() {
        if (window.innerWidth < BREAKPOINT) return;
        dropdown.classList.remove('visually-hidden');
        opened = true;

        // update the city list (it depends on the selected country)
        if (typeof renderCityList === 'function') {
            const selectedCountry = countryInput.dataset.countryKey;
            let list = [];

            if (selectedCountry && allCities[selectedCountry]) {
                list = allCities[selectedCountry];
            } else {
                for (let key in allCities) list = list.concat(allCities[key]);
            }
            list.sort((a,b) => a.localeCompare(b));
            renderCityList(list);
        }

        syncPosition();
        window.addEventListener('scroll',  syncPosition);
        window.addEventListener('resize',  syncPosition);
        setTimeout(() => searchInput.focus(), 10);
    }

    function closeDesktopDropdown() {
        dropdown.classList.add('visually-hidden');
        opened = false;

        // web won't do extra work
        window.removeEventListener('scroll',  syncPosition);
        window.removeEventListener('resize',  syncPosition);
        document.removeEventListener('click', handleClickOutside); // Preventing memory leaks
    }

    // clicks
    cityInputBox.addEventListener('click', openDesktopDropdown);
    if (closeButton) closeButton.addEventListener('click', closeDesktopDropdown);
})();


function inputCity() {
  if (citiesInput && citiesDropdown && citiesSearchInput) {
      citiesInput.addEventListener('click', () => {
      citiesDropdown.classList.remove('visually-hidden');
      //document.documentElement.classList.add('no-scroll');
      if (window.matchMedia('(max-width: 1023px)').matches) {
          document.documentElement.classList.add('no-scroll');
      }
      citiesSearchInput.value = ''; // reset the search bar
      setTimeout(() => {
        citiesSearchInput.focus(); // keyboard appears
      }, 10);
    });
  }

  if (closeCitiesSearch && citiesDropdown && citiesSearchInput) {
    closeCitiesSearch.addEventListener('click', () => {
      citiesDropdown.classList.add('visually-hidden');
      document.documentElement.classList.remove('no-scroll');
      citiesSearchInput.blur(); // hide keyboard
    });
  }

  // Select city in search
  let allCities = {}; // Globally accessible object



fetch('./data/locations.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to load file: ' + response.status);
    }
    return response.json();
  })
  .then(data => {
    data.cities.forEach(city => {
      const country = city.country;
      const cityName = city.name;

      if (!allCities[country]) {
        allCities[country] = [];
      }
      allCities[country].push(cityName);
    });
    // console.log('Cities by country:', allCities);


  if (citiesSearchInput) {
      citiesSearchInput.addEventListener('input', () => {
          const searchValue = citiesSearchInput.value.trim().toLowerCase();
          let filteredCities = [];

          if (selectedCountryKey && allCities[selectedCountryKey]) {
              filteredCities = allCities[selectedCountryKey].filter(city =>
                  (translations[city] || city).toLowerCase().startsWith(searchValue)
              );
          } else {
              for (let key in allCities) {
                  const matchingCities = allCities[key].filter(city =>
                      (translations[city] || city).toLowerCase().startsWith(searchValue)
                  );
                  filteredCities = filteredCities.concat(matchingCities);
              }
          }

          renderCityList(filteredCities);
      });
  }
  })

  .catch(error => {
    console.error('Error loading cities:', error);
  });


function renderCityList(cities) {
  const list = document.getElementById('cities-list');
  list.innerHTML = '';

  cities.forEach(city => {
    const li = document.createElement('li');
    li.textContent = translations[city] || city;

    li.addEventListener('click', () => {
      // Insert the city translation into the input field
      citiesInput.value = translations[city] || city;

      // Substitute the corresponding country (translated)
      for (let country in allCities) {
        if (allCities[country].includes(city)) {
          selectedCityKey = city;
          selectedCountryKey = country;
          countryInput.dataset.countryKey = country;
          countryInput.value = translations[country] || country;
          break;
        }
      }

      citiesDropdown.classList.add('visually-hidden');
      citiesSearchInput.blur();
      document.documentElement.classList.remove('no-scroll');
    });

    list.appendChild(li);
  });
}


if (citiesInput && citiesDropdown && citiesSearchInput && countryInput) {
  citiesInput.addEventListener('click', () => {
    const selectedCountry = countryInput.dataset.countryKey;

    let cities = [];

    if (selectedCountry && allCities[selectedCountry]) {
      cities = allCities[selectedCountry];
    } else {
      for (let key in allCities) {
        cities = cities.concat(allCities[key]);
      }
    }

    cities.sort((a, b) => a.localeCompare(b));
    renderCityList(cities);

    citiesDropdown.classList.remove('visually-hidden');
    citiesSearchInput.value = '';
    setTimeout(() => {
      citiesSearchInput.focus();
    }, 10);
  });
}
}


const searchDirectionButton = document.getElementById('search-direction-button');
const lang = localStorage.getItem('lang') || 'en';

function showAlert(message) {
  let alertBox = document.createElement('div');
  alertBox.className = 'custom-alert';
  alertBox.textContent = message;
  document.body.appendChild(alertBox);

  // Smooth appearance and disappearance
  setTimeout(() => {
    alertBox.classList.add('show');
  }, 10);

  setTimeout(() => {
    alertBox.classList.remove('show');
    setTimeout(() => alertBox.remove(), 500);
  }, 3000);
}

if (searchDirectionButton && countryInput && citiesInput) {
  searchDirectionButton.addEventListener('click', () => {
    if (!selectedCountryKey || !selectedCityKey) {
      showAlert(translations["alert_fill_country_city"] || "Please select both a country and a city.");
      return;
    }

    const lang = localStorage.getItem('lang') || 'en';

    localStorage.setItem('destination', JSON.stringify({
      country: selectedCountryKey.toLowerCase(),
      city: selectedCityKey.toLowerCase(),
      lang: lang
    }));

    window.location.href = 'results.html';
  });
}


// Swiper
document.addEventListener('DOMContentLoaded', () => {
  const swiper = new Swiper('.swiper', {
    loop: true, // infinite scrolling
    centeredSlides: true,
    slidesPerView: 1,
    spaceBetween: 20,
    grabCursor: true,

    autoplay: {
      delay: 4000,
      disableOnInteraction: false,
    },

    // adaptation to screen size
    breakpoints: {
      640: { slidesPerView: 1.2 },
      768: { slidesPerView: 1.5 },
      1024: { slidesPerView: 2.5 },
      1300: { slidesPerView: 3 },
    },

    // arrows (they are already in html)
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    }
  });
});


// Implementation for "Find out more"
document.querySelectorAll('.find-out').forEach(button => {
  button.addEventListener('click', (event) => {
    event.preventDefault(); // do not follow the link immediately

    const country = button.getAttribute('data-country');
    const city = button.getAttribute('data-city');
    const lang = localStorage.getItem('lang') || 'en';

    // Save keys (not translations!)
    localStorage.setItem('destination', JSON.stringify({
      country,
      city,
      lang
    }));

    // Go to results.html
    window.location.href = 'results.html';
  });

    // search <img> near this link
    const container = button.closest('.gallery-item');
    const img = container?.querySelector('img');
    if (img) {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
            // Repeat the behavior of the link
            const country = button.getAttribute('data-country');
            const city = button.getAttribute('data-city');
            const lang = localStorage.getItem('lang') || 'en';

            localStorage.setItem('destination', JSON.stringify({
                country,
                city,
                lang
            }));

            window.location.href = 'results.html';
        });
    }
});


// data from apiWeatherNow
let currentTemp, weatherDescription, weatherIconUrl, feelsLike, sunriseTime, sunsetTime;

//data from apiWeather4
let threeDayHourlyTemps = {
  day1: {
    "08:00": { actual: null, feelsLike: null, icon: null },
    "12:00": { actual: null, feelsLike: null, icon: null },
    "16:00": { actual: null, feelsLike: null, icon: null },
    "20:00": { actual: null, feelsLike: null, icon: null }
  },
  day2: {
    "08:00": { actual: null, feelsLike: null, icon: null },
    "12:00": { actual: null, feelsLike: null, icon: null },
    "16:00": { actual: null, feelsLike: null, icon: null },
    "20:00": { actual: null, feelsLike: null, icon: null }
  },
  day3: {
    "08:00": { actual: null, feelsLike: null, icon: null },
    "12:00": { actual: null, feelsLike: null, icon: null },
    "16:00": { actual: null, feelsLike: null, icon: null },
    "20:00": { actual: null, feelsLike: null, icon: null }
  }
};

// data from restcountries
let flagOfCountry, langOfCountry, currencyOfCountry, populationOfCountry, areaOfCountry;

if (window.location.pathname.includes('results.html')) {
  const apiKey = 'cd8a57939170340143bfa9970a41d91a';
  let country, city;

  if (window.location.pathname.includes('results.html')) {
    const destination = JSON.parse(localStorage.getItem('destination'));

    if (!destination) {
      alert("No destination selected.");
      window.location.href = "index.html";
    }

    ({ country, city } = destination); // use destructuring for already declared ones
  }

  let apiWeatherNow;
  if (lang === "en") {
    apiWeatherNow = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=en`;
  } else if (lang === "cs") {
    apiWeatherNow = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=cs`;
  } else {
    apiWeatherNow = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ru`;
  }

  // Call to OpenWeather
  fetch(apiWeatherNow)

    .then(res => res.json())
    .then(data => {
      currentTemp = Math.round(data.main.temp * 10) / 10;
      feelsLike = Math.round(data.main.feels_like * 10) / 10;
      weatherDescription = data.weather[0].description;
      /* I took this from a guide on YouTube */
      sunriseTime = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      sunsetTime = new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // console.log("City:", city);
      // console.log("Temp:", currentTemp + "°C");
      document.getElementById('current-temp').textContent = `${currentTemp} °C`;

      //console.log("Real feeling:", feelsLike + "°C");
      document.getElementById('feels-like').textContent = `${feelsLike} °C`;

      // console.log("Weather description:", weatherDescription);
      const capitalizedDescription = weatherDescription.charAt(0).toUpperCase() + weatherDescription.slice(1);
      document.getElementById('weather-description').textContent = capitalizedDescription;

      const iconCode = data.weather[0].icon; // "02d" for example
      weatherIconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
      // console.log("Icon:", weatherIconUrl);
      document.getElementById('weather-card-icon').src = weatherIconUrl;
      document.getElementById('weather-card-icon').alt = "Weather in the city now";


      // console.log("🌅 Sunrise:", sunriseTime);
      // console.log("🌇 Sunset:", sunsetTime);
      document.getElementById('sunrise-time').textContent = `${sunriseTime}`
      document.getElementById('sunset-time').textContent = `${sunsetTime}`
    })
    .catch(err => {
      console.error("Error retrieving weather data:", err);
    });


  // improved to avoid unnecessary if/else
  let apiClimate4 = `https://pro.openweathermap.org/data/2.5/forecast/hourly?q=${city}&appid=${apiKey}&units=metric&lang=${lang}`;

  let now = new Date();

  let day1Date = new Date(now);
  day1Date.setDate(now.getDate() + 1);
  let d1 = day1Date.toISOString().split("T")[0]; // Tomorrow

  let day2Date = new Date(now);
  day2Date.setDate(now.getDate() + 2);
  let d2 = day2Date.toISOString().split("T")[0]; // Day after tomorrow

  let day3Date = new Date(now);
  day3Date.setDate(now.getDate() + 3);
  let d3 = day3Date.toISOString().split("T")[0]; // After the day after tomorrow


  fetch(apiClimate4)
    .then(res => res.json())
    .then(data => {
      if (!data.list) {
        //console.log("No data list");
        return;
      }

      data.list.forEach(item => {
        const dateTime = item.dt_txt; // "2025-06-05 08:00:00"
        const [date, time] = dateTime.split(" "); // "2025-06-05", "08:00:00"
        const shortTime = time.slice(0, 5); // "08:00"

        const temp = Math.round(item.main.temp * 10) / 10;
        const feels = Math.round(item.main.feels_like * 10) / 10;
        const icon = `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;

        if (date === d1 && threeDayHourlyTemps.day1[shortTime]) {
          threeDayHourlyTemps.day1[shortTime] = {
            actual: temp,
            feelsLike: feels,
            icon: icon
          };
        }

        if (date === d2 && threeDayHourlyTemps.day2[shortTime]) {
          threeDayHourlyTemps.day2[shortTime] = {
            actual: temp,
            feelsLike: feels,
            icon: icon
          };
        }

        if (date === d3 && threeDayHourlyTemps.day3[shortTime]) {
          threeDayHourlyTemps.day3[shortTime] = {
            actual: temp,
            feelsLike: feels,
            icon: icon
          };
        }
      });

      // console.log("threeDayHourlyTemps (all hours):", threeDayHourlyTemps);
      forecastContainer.innerHTML = ""; // clear before inserting

      const forecastDays = ["day1", "day2", "day3"];

      const today = new Date();

      const dayNames = [
        translations["tomorrow"] || "Tomorrow",
        getFormattedDate(addDays(today, 2)),
        getFormattedDate(addDays(today, 3))
      ];

      function addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
      }

      function getFormattedDate(date) {
        const options = { day: 'numeric', month: 'long' };
        return date.toLocaleDateString(localStorage.getItem('lang') || 'en', options);
      }

      forecastDays.forEach((dayKey, index) => {
      const dayData = threeDayHourlyTemps[dayKey];

      const dayDiv = document.createElement('div');
      dayDiv.classList.add('forecast-day');

      const h3 = document.createElement('h3');
      if (index === 0) {
          h3.setAttribute('data-i18n', 'tomorrow');
          h3.textContent = translations["tomorrow"] || "Tomorrow";
      } else if (index === 1) {
          h3.setAttribute('data-i18n', 'forecast_day2');
          h3.textContent = translations["forecast_day2"] || "In 2 days";
      } else if (index === 2) {
          h3.setAttribute('data-i18n', 'forecast_day3');
          h3.textContent = translations["forecast_day3"] || "In 3 days";
      }

      dayDiv.appendChild(h3);

      let wrapperDiv = document.createElement('div');
      wrapperDiv.classList.add('forecast-wrapper'); // common container for 4 elements
      let count = 0;

      for (const hour in dayData) {
        const slot = dayData[hour];

        const slotDiv = document.createElement('div');
        slotDiv.classList.add('weather-forecast-time-and-temp');

        const timeP = document.createElement('p');
        timeP.classList.add('forecast-time');
        timeP.textContent = hour;

        const iconImg = document.createElement('img');
        iconImg.classList.add('forecast-icon');
        iconImg.src = slot.icon;
        iconImg.alt = "Forecast icon";

        const tempP = document.createElement('p');
        tempP.classList.add('forecast-temp');
        tempP.textContent = `${slot.actual}°C`;

        slotDiv.append(timeP, iconImg, tempP);
        wrapperDiv.appendChild(slotDiv);
        count++;

        if (count === 4) {
          dayDiv.appendChild(wrapperDiv); // add the current wrapper
          wrapperDiv = document.createElement('div'); // create a new one for the next 4
          wrapperDiv.classList.add('forecast-wrapper');
          count = 0;
        }
      }

      // if there are < 4 elements left, add the last wrapper
      if (count > 0) {
          dayDiv.appendChild(wrapperDiv);
        }
        forecastContainer.appendChild(dayDiv);
      });
    })

    .catch(function(err) {
      console.error("Error while getting forecast:", err);
    });

    const forecastContainer = document.getElementById('forecast-container');


  // Request to restcountries
  let restcountries = `https://restcountries.com/v3.1/name/${capitalizeWords(country)}`
  fetch(restcountries)
    .then(res => res.json())
    .then(data => {
      const info = data[0];
      flagOfCountry = info.flags?.png;
      // console.log("Flag:", flagOfCountry);

      // send flag to results.html
      document.getElementById('country-flag').src = flagOfCountry;
      document.getElementById('country-flag').alt = `Flag of ${country}`;

      const languages = info.languages;
      //const langOfCountry = languages ? Object.values(languages).join(', ') : 'No data';
      const langOfCountry = languages ? Object.values(languages).slice(0, 3).join(', ') : 'No data'; // max 3 lang
      //console.log("Languages of the country:", langOfCountry);
      const el = document.getElementById('country-language');
      if (el) {
        el.textContent = langOfCountry;
      }

      const currencies = info.currencies;
      if (currencies) {
        const currencyArray = Object.values(currencies); // get array of currencies
        const namesAndSymbols = [];

        for (let i = 0; i < currencyArray.length; i++) {
          const currency = currencyArray[i];
          const name = currency.name;
          const symbol = currency.symbol;
          namesAndSymbols.push(name + ' (' + symbol + ')');
        }
        currencyOfCountry = namesAndSymbols.join(', ');

      } else {
        currencyOfCountry = 'No data';
      }
      //console.log("Currency of the country:", currencyOfCountry);
      document.getElementById('country-currency').textContent = currencyOfCountry;

      populationOfCountry = info.population;
      //console.log("Country population: ", populationOfCountry);
      document.getElementById('country-population').textContent = (populationOfCountry / 1000000).toFixed(1);

      areaOfCountry = info.area?.toLocaleString() || 'No data';
      //console.log("Area of country:", areaOfCountry);
      document.getElementById('country-area').textContent = areaOfCountry;
    })
    .catch(err => {
      console.error("Error retrieving country data:", err);
    });
}

  // Climatic Forecast 30 days
  /*
  let apiClimate = `https://pro.openweathermap.org/data/2.5/forecast/climate?q=${city}&appid=${apiKey}&units=metric&lang=${lang}`;
  fetch(apiClimate)
    .then(res => res.json())
    .then(data => {
      //console.log(data);

      //console.log(data.city.name);
      //console.log(data.city.population);
    });
  */


const BackButton = document.getElementById('back-button');
if (BackButton) {
  BackButton.addEventListener('click', () => {
    window.history.back();
  });
}

// Get a string from localStorage
const destinationStr = localStorage.getItem('destination');

// Convert JSON string to object
const destination = JSON.parse(destinationStr);

// Now I can access each field
let country = '';
let city = '';

// additional check so that WebStorm doesn't complain
if (destination && typeof destination === 'object') {
  country = destination.country;
  city = destination.city;
}


document.addEventListener('DOMContentLoaded', () => {
  const scrollToTopButton = document.getElementById('scroll-top-button');
  if (scrollToTopButton) {
    scrollToTopButton.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
});


/*
if (window.location.pathname.includes('results.html')) {
  const destinationStr = localStorage.getItem('destination');
  const destination = JSON.parse(destinationStr);

  let country = destination.country;
  let city = destination.city;

  const countryCityEl = document.getElementById('country-city');
  if (countryCityEl) {
    countryCityEl.textContent = `${capitalizeWords(city)}, ${capitalizeWords(country)}`;
  }
}
*/

/*
const countryCityElement = document.getElementById('country-city');
if (countryCityElement) {
  countryCityElement.textContent = `${capitalizeWords(city)}, ${capitalizeWords(country)}`;
}
*/

function updateCountryCity() {
  const destination = JSON.parse(localStorage.getItem('destination'));
  if (!destination) return;

  const country = destination.country;
  const city = destination.city;

  const countryCityElement = document.getElementById('country-city');
  if (countryCityElement) {
    const translatedCity = translations[city] || capitalizeWords(city);
    const translatedCountry = translations[country] || capitalizeWords(country);
    countryCityElement.textContent = `${translatedCity}, ${translatedCountry}`;
  }
}


const galleryWrapper = document.getElementById('city-gallery');
if (galleryWrapper) {
  const totalPhotos = 4;
  for (let i = 1; i <= totalPhotos; i++) {
    const img = document.createElement('img');
    img.src = `./images/photos_of_cities/${country.toLowerCase()}/${city.toLowerCase()}/${city.toLowerCase()}_${i}.jpg`;
    img.alt = `${city} photo ${i}`;
    img.classList.add('gallery-image');
    galleryWrapper.appendChild(img);
  }
}


const saveButton = document.getElementById('save-button');
let favoriteCities = [];
let numOfFavoriteCities = 0;

const savedCities = localStorage.getItem('favoriteCities');
if (savedCities) {
  favoriteCities = JSON.parse(savedCities);
  numOfFavoriteCities = favoriteCities.length;
  //console.log(favoriteCities);
  //console.log(numOfFavoriteCities);
}

if (saveButton) {
  // Get a string from localStorage
  const destinationStr = localStorage.getItem('destination');
  // Convert JSON string to object
  const destination = JSON.parse(destinationStr);

  // Check if this city is already saved
  const isInFavorites = () => {
    if (!destination) return false;
    // Extract country and city
    const country = destination.country;
    const city = destination.city;
    // Convert to lowercase
    const countryKey = country.toLowerCase();
    const cityKey = city.toLowerCase();
    return favoriteCities.some(item =>
        item.country === countryKey && item.city === cityKey
    );
  };

  // Set the correct text on the button
  updateButtonText();

  // Single handler: add or remove
  saveButton.addEventListener('click', () => {
    if (!destination) return;

    const cityKey    = destination.city.toLowerCase();
    const countryKey = destination.country.toLowerCase();

    if (isInFavorites()) {
      // Delete
      favoriteCities = favoriteCities.filter(item =>
          !(item.country === countryKey && item.city === cityKey)
      );
      //console.log(`Deleted: ${countryKey}, ${cityKey}`);
    } else {
      // Add
      favoriteCities.push({ country: countryKey, city: cityKey });
      //console.log(`Saved:   ${countryKey}, ${cityKey}`);
    }

    // Save and display the current state
    localStorage.setItem('favoriteCities', JSON.stringify(favoriteCities));
    //console.log(JSON.stringify(favoriteCities));

    // Update the button caption
    updateButtonText();

    // Redraw it
    if (typeof renderFavoriteCitiesList === 'function') {
      renderFavoriteCitiesList();
    }
  });

  // ——— Helper for changing text and data-i18n ———
  function updateButtonText() {
    if (isInFavorites()) {
      saveButton.textContent = 'Delete city';
      saveButton.setAttribute('data-i18n', 'delete_city');
      saveButton.style.backgroundColor = 'rgb(246,104,104)';
    } else {
      saveButton.textContent = 'Save city';
      saveButton.setAttribute('data-i18n', 'save_city');
      saveButton.style.backgroundColor = 'rgb(127, 255, 212)';
    }
  }
}





/* Display user's favorite cities */
//document.addEventListener('DOMContentLoaded', () => {
function renderFavoriteCitiesList() {
  const favoritesCitiesCards = document.getElementById('favorites-cities-cards');
  if (!favoritesCitiesCards) return;

  favoritesCitiesCards.innerHTML = '';

  // Read the current data
  const favoriteUserCitiesKeys = JSON.parse(localStorage.getItem('favoriteCities')) || [];
  const numOfFavorites= favoriteUserCitiesKeys.length;
  const currentLang= localStorage.getItem('lang') || 'en';

  //console.log(`[renderFavoriteCitiesList] lang=${currentLang}, favorites=${numOfFavorites}`);

  // If there are no favorites, show one message and exit
  if (numOfFavorites === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.classList.add('empty-favorites-message');

    if (currentLang === 'cs') {
      emptyMessage.textContent = 'Zde se zobrazí vaše oblíbená města.';
    } else if (currentLang === 'ru') {
      emptyMessage.textContent = 'Здесь появятся ваши любимые города.';
    } else {
      emptyMessage.textContent = "You don't have any favorite cities yet.";
    }

    favoritesCitiesCards.appendChild(emptyMessage);
    //document.querySelector('.favorite-cities').style.height = '50vh';

    // Destroy Swiper if there was one
    if (window.favoritesSwiper) {
      window.favoritesSwiper.destroy(true, true);
      delete window.favoritesSwiper;
    }
    return;
  }

  // Render each card
  favoriteUserCitiesKeys.forEach(({ country, city }) => {
    const swiperSlide  = document.createElement('div');
    swiperSlide.classList.add('swiper-slide');
    favoritesCitiesCards.appendChild(swiperSlide);

    const galleryItem  = document.createElement('div');
    galleryItem.classList.add('gallery-item');
    swiperSlide.appendChild(galleryItem);

    const cityGalleryName = document.createElement('h3');
    cityGalleryName.classList.add('city-main-gallery');

    const translatedCountry = translations[country] || capitalizeWords(country);
    const translatedCity    = translations[city]    || capitalizeWords(city);
    cityGalleryName.textContent = `${translatedCountry}, ${translatedCity}`;
    galleryItem.appendChild(cityGalleryName);

    const cityGalleryImg = document.createElement('img');
    cityGalleryImg.classList.add('city-gallery-img');
    cityGalleryImg.src = `./images/photos_of_cities/${country}/${city}/${city}_1.jpg`;
    cityGalleryImg.alt = `Photos of the ${city}`;
    cityGalleryImg.loading = 'lazy';
    galleryItem.appendChild(cityGalleryImg);

    const cityButtons = document.createElement('div');
    cityButtons.classList.add('city-buttons');
    galleryItem.appendChild(cityButtons);

    const moreDetails = document.createElement('a');
    moreDetails.classList.add('more-details');
    moreDetails.setAttribute('data-i18n', 'details');
    moreDetails.textContent = translations["details"] || "Details";
    cityButtons.appendChild(moreDetails);

    const deleteCity = document.createElement('a');
    deleteCity.classList.add('delete-city');
    deleteCity.textContent = '❌';
    cityButtons.appendChild(deleteCity);

    moreDetails.addEventListener('click', () => {
      const lang = localStorage.getItem('lang') || 'en';

      localStorage.setItem('destination', JSON.stringify({ country, city, lang }));
      window.location.href = 'results.html';
    });

    deleteCity.addEventListener('click', () => {
      // Get the list
      let favorites = JSON.parse(localStorage.getItem('favoriteCities')) || [];

      // Delete the current one
      const updatedFavorites = favorites.filter(item =>
          !(item.country === country && item.city === city)
      );

      // Overwrite localStorage
      localStorage.setItem('favoriteCities', JSON.stringify(updatedFavorites));

      // Remove the card from the DOM
      swiperSlide.remove();

      //console.log(`Deleted: ${country}, ${city}`);

      // If user has deleted all favorites, redraw emptyMessage
      if (updatedFavorites.length === 0) {
        renderFavoriteCitiesList();
        return;
      }

      // Otherwise, just update Swiper to recalculate slides
      if (window.favoritesSwiper) {
        window.favoritesSwiper.update();
      }
    });
  });

  // Re-initialize Swiper
  if (window.favoritesSwiper) {
    window.favoritesSwiper.destroy(true, true);
  }

  window.favoritesSwiper = new Swiper('#favorites-swiper', {
    loop: true,
    slidesPerView: 1,
    spaceBetween: 20,
    grabCursor: true,
    breakpoints: {
      640: { slidesPerView: 1.2 },
      768: { slidesPerView: 1.5 },
      1024: { slidesPerView: 2.5 },
      1300: { slidesPerView: 3 },
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  });
}


document.addEventListener("DOMContentLoaded", () => {
    const isDesktop = window.matchMedia("(min-width: 1024px) and (hover: hover)").matches;

    if (isDesktop) {
        const backgrounds = [
            './images/desktop_background2.jpg',
            './images/desktop_background3.jpg',
            './images/desktop_background1.jpg'
        ];

        const storageKey = 'backgroundIndex';
        let currentIndex = parseInt(localStorage.getItem(storageKey), 10);

        // check: if there is no value or it is incorrect: start from 0
        if (isNaN(currentIndex) || currentIndex >= backgrounds.length) {
            currentIndex = 0;
        }

        // Use background
        const selectedBackground = backgrounds[currentIndex];
        const header = document.querySelector('.header');
        if (header) {
            header.style.backgroundImage = `url('${selectedBackground}')`;
            header.style.backgroundSize = 'cover';
            header.style.backgroundPosition = 'center';
        }

        // Update the index for next time
        const nextIndex = (currentIndex + 1) % backgrounds.length;
        localStorage.setItem(storageKey, nextIndex.toString());
    }
});




