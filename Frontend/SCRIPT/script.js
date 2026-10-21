
document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // 1. ELEMENTS
    const searchForm = document.getElementById("searchForm");
    const locationInput = document.getElementById("locationInput");
    const searchButton = document.getElementById("searchButton");
    const mapMessage = document.getElementById("mapMessage");
    const locateMeBtn = document.getElementById("locateMeBtn");
    const resetFiltersBtn = document.getElementById("resetFilters");
    const showAllBtn = document.getElementById("showAllBtn");
    const filterButtons = document.querySelectorAll(".filter-btn");
    let chargerItems = document.querySelectorAll(".charger-item");
    const resultsCount = document.getElementById("resultsCount");
    const noResults = document.getElementById("noResults");
    const hostForm = document.getElementById("hostForm");
    const API_URL = "http://localhost:8080/api/chargers";

    let activeFilter = "all";
    let searchedCityMarker = null;
    let userLocationMarker = null;
    let map = null;
    let demoMarkers = [];

    // 2. HELPERS
    function showMapMessage(message, isError = false) {
        if (!mapMessage) return;
        mapMessage.textContent = message;
        mapMessage.classList.toggle("error", isError);
    }

    function setSearchLoading(isLoading) {
        if (!searchButton) return;
        searchButton.disabled = isLoading;
        searchButton.textContent = isLoading ? "Searching..." : "Search";
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (character) => {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };
            return entities[character];
        });
    }

    function getDirectionsUrl(charger) {
        const latitude = Number(charger.latitude);
        const longitude = Number(charger.longitude);

        const hasCoordinates =
            charger.latitude !== null &&
            charger.latitude !== undefined &&
            charger.longitude !== null &&
            charger.longitude !== undefined &&
            Number.isFinite(latitude) &&
            Number.isFinite(longitude) &&
            latitude >= -90 &&
            latitude <= 90 &&
            longitude >= -180 &&
            longitude <= 180 &&
            (latitude !== 0 || longitude !== 0);

        const destination = hasCoordinates
            ? `${latitude},${longitude}`
            : String(charger.address || "").trim();

        if (!destination) return null;

        return "https://www.google.com/maps/dir/?api=1&destination=" +
            encodeURIComponent(destination) +
            "&travelmode=driving";
    }

    // 3. LOAD DATABASE CHARGERS
    async function loadDatabaseChargers() {
        const chargerList = document.getElementById("chargerList");
        if (!chargerList) return;

        try {
            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const chargers = await response.json();
            chargerList.innerHTML = "";

            chargers.forEach((charger) => {
                const vehicle = String(charger.vehicleType || "").toLowerCase();

                let type = "both";
                let tag = "2W + 4W";
                let symbol = "🔌";
                let vehicleLabel = "Multiple vehicle types";

                if (["2w", "2-wheeler", "two wheeler", "two-wheeler"].includes(vehicle)) {
                    type = "2w";
                    tag = "2-WHEELER";
                    symbol = "🛵";
                    vehicleLabel = "Two wheeler";
                } else if (["4w", "4-wheeler", "four wheeler", "four-wheeler"].includes(vehicle)) {
                    type = "4w";
                    tag = "4-WHEELER";
                    symbol = "🚙";
                    vehicleLabel = "Four wheeler";
                }

                const name = escapeHTML(charger.name || "Charger");
                const address = escapeHTML(charger.address || "Location not specified");
                const price = Number(charger.pricePerHour);
                const safePrice = Number.isFinite(price) ? price : 0;
                const availability = charger.available
                    ? "Available"
                    : "Currently unavailable";

                const directionsUrl = getDirectionsUrl(charger);

                const directionsButton = directionsUrl
                    ? `<a class="btn btn-outline-success"
                           href="${directionsUrl}"
                           target="_blank"
                           rel="noopener noreferrer">
                           🗺️ Get Directions
                       </a>`
                    : `<button class="btn btn-outline-secondary" disabled>
                           Location unavailable
                       </button>`;

                const card = document.createElement("div");
                card.className = "col-md-6 col-lg-4 charger-item";
                card.dataset.type = type;
                card.dataset.location = charger.address || "";

                card.innerHTML = `
                    <article class="charger-card">
                        <div class="charger-image charger-image-one">
                            <span class="charger-type-tag">${tag}</span>
                            <span class="charger-image-symbol">${symbol}</span>
                        </div>

                        <div class="charger-content">
                            <div class="charger-location">📍 ${address}</div>
                            <h4>${name}</h4>

                            <p class="charger-description">
                                Host-submitted charging listing.
                                Verify charger details with the host.
                            </p>

                            <div class="charger-specs">
                                <span>⚡ ${availability}</span>
                                <span>${vehicleLabel}</span>
                            </div>

                            <div class="charger-bottom">
                                <div class="price">
                                    ₹${safePrice}
                                    <small>/ hour</small>
                                </div>

                                <button class="btn btn-success details-btn"
                                    data-name="${name}"
                                    data-location="${address}"
                                    data-type="${vehicleLabel}"
                                    data-price="₹${safePrice} / hour"
                                    data-description="Host-submitted listing. Confirm connector compatibility and electrical safety with the host.">
                                    View details
                                </button>
                            </div>

                            <div class="mt-3">
                                ${directionsButton}
                            </div>
                        </div>
                    </article>
                `;

                chargerList.appendChild(card);
            });

            chargerItems = chargerList.querySelectorAll(".charger-item");

            chargerList.querySelectorAll(".details-btn").forEach((button) => {
                button.addEventListener("click", () => {
                    const setText = (id, value) => {
                        const element = document.getElementById(id);
                        if (element) element.textContent = value;
                    };

                    setText("modalChargerName", button.dataset.name || "Charger details");
                    setText("modalLocation", `📍 ${button.dataset.location || "Location not specified"}`);
                    setText("modalType", button.dataset.type || "Not specified");
                    setText("modalPrice", button.dataset.price || "Not specified");
                    setText("modalDescription", button.dataset.description || "No additional details available.");

                    const modalElement = document.getElementById("chargerModal");

                    if (modalElement && typeof bootstrap !== "undefined") {
                        bootstrap.Modal.getOrCreateInstance(modalElement).show();
                    }
                });
            });

            filterChargers(activeFilter);

            showMapMessage(
                `Loaded ${chargers.length} charger listing(s) from the database. Map pins are illustrative demo locations.`
            );
        } catch (error) {
            console.error("Failed to load chargers:", error);
            showMapMessage(
                "Database chargers could not be loaded. Check that the backend is running.",
                true
            );
        }
    }

    // 4. INITIALIZE LEAFLET MAP
    if (typeof L !== "undefined" && document.getElementById("chargerMap")) {
        map = L.map("chargerMap").setView([22.9734, 78.6569], 5);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);

        const demoChargers = [
            {
                name: "Home Scooter Charging",
                city: "Dadri, Uttar Pradesh",
                coords: [28.5520, 77.5540],
                type: "2w",
                price: "₹20 / session (demo)"
            },
            {
                name: "Residential EV Charging",
                city: "Noida, Uttar Pradesh",
                coords: [28.5355, 77.3910],
                type: "4w",
                price: "₹100 / hour (demo)"
            },
            {
                name: "Multi-Vehicle Charging Spot",
                city: "Delhi, India",
                coords: [28.6139, 77.2090],
                type: "both",
                price: "₹50 / session (demo)"
            }
        ];

        demoChargers.forEach((charger) => {
            const marker = L.marker(charger.coords);

            marker.bindPopup(`
                <div class="map-popup">
                    <strong>${escapeHTML(charger.name)}</strong>
                    <p>${escapeHTML(charger.city)}</p>
                    <p>${escapeHTML(charger.price)}</p>
                    <p>Sample map location — not verified</p>
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        `${charger.coords[0]},${charger.coords[1]}`
                    )}&travelmode=driving"
                       target="_blank" rel="noopener noreferrer">
                       Get directions
                    </a>
                </div>
            `);

            marker.addTo(map);
            demoMarkers.push({ marker, type: charger.type });
        });

        updateMapMarkers();
        setTimeout(() => map.invalidateSize(), 200);
    } else {
        showMapMessage(
            "The map library could not load. Check your internet connection and reload.",
            true
        );
    }

    // 5. FILTER MAP MARKERS
    function updateMapMarkers() {
        if (!map) return;

        demoMarkers.forEach((item) => {
            const matches =
                activeFilter === "all" ||
                item.type === activeFilter ||
                item.type === "both";

            if (matches && !map.hasLayer(item.marker)) {
                item.marker.addTo(map);
            } else if (!matches && map.hasLayer(item.marker)) {
                map.removeLayer(item.marker);
            }
        });
    }

    // 6. FILTER CHARGER CARDS
    function filterChargers(type) {
        activeFilter = type;

        filterButtons.forEach((button) => {
            const isActive = button.dataset.type === type;
            button.classList.toggle("active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });

        let visibleCount = 0;

        chargerItems.forEach((item) => {
            const itemType = item.dataset.type;
            const matches =
                type === "all" ||
                itemType === type ||
                itemType === "both";

            item.classList.toggle("d-none", !matches);
            if (matches) visibleCount++;
        });

        if (resultsCount) {
            resultsCount.textContent =
                `${visibleCount} ${visibleCount === 1 ? "listing" : "listings"}`;
        }

        if (noResults) {
            noResults.classList.toggle("d-none", visibleCount !== 0);
        }

        updateMapMarkers();
    }

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            filterChargers(button.dataset.type);
        });
    });

    if (showAllBtn) {
        showAllBtn.addEventListener("click", () => filterChargers("all"));
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener("click", () => {
            filterChargers("all");
            if (locationInput) locationInput.value = "";

            if (map) {
                map.setView([22.9734, 78.6569], 5);

                if (searchedCityMarker) {
                    map.removeLayer(searchedCityMarker);
                    searchedCityMarker = null;
                }

                if (userLocationMarker) {
                    map.removeLayer(userLocationMarker);
                    userLocationMarker = null;
                }
            }

            showMapMessage("Showing illustrative sample map locations.");
        });
    }

    // 7. SEARCH A PLACE IN INDIA
    if (searchForm && locationInput) {
        searchForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const query = locationInput.value.trim();

            if (!query) {
                showMapMessage("Please enter a city or area name.", true);
                locationInput.focus();
                return;
            }

            if (!map) {
                showMapMessage("The map is unavailable. Check your internet connection.", true);
                return;
            }

            setSearchLoading(true);
            showMapMessage(`Searching for "${query}" in India...`);

            try {
                const params = new URLSearchParams({
                    q: `${query}, India`,
                    format: "jsonv2",
                    countrycodes: "in",
                    limit: "1"
                });

                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
                    { headers: { Accept: "application/json" } }
                );

                if (!response.ok) throw new Error("Location service unavailable");

                const results = await response.json();

                if (!results.length) {
                    showMapMessage("Location nahi mili. Area ya city ka naam check karo.", true);
                    return;
                }

                const place = results[0];
                const placeLat = Number(place.lat);
                const placeLon = Number(place.lon);

                if (!Number.isFinite(placeLat) || !Number.isFinite(placeLon)) {
                    throw new Error("Invalid location coordinates");
                }

                map.setView([placeLat, placeLon], 12);

                if (searchedCityMarker) map.removeLayer(searchedCityMarker);

                searchedCityMarker = L.marker([placeLat, placeLon])
                    .addTo(map)
                    .bindPopup(
                        `<strong>${escapeHTML(place.display_name)}</strong><br>` +
                        "Searched location — charger availability not verified."
                    )
                    .openPopup();

                showMapMessage(`Location found: ${place.display_name}. Charger availability is not verified.`);
            } catch (error) {
                console.error("Location search error:", error);
                showMapMessage("Location search failed. Check your internet and try again.", true);
            } finally {
                setSearchLoading(false);
            }
        });
    }

    // 8. CURRENT LOCATION
    if (locateMeBtn) {
        locateMeBtn.addEventListener("click", () => {
            if (!map) {
                showMapMessage("Map is unavailable.", true);
                return;
            }

            if (!navigator.geolocation) {
                showMapMessage("This browser does not support location access.", true);
                return;
            }

            locateMeBtn.disabled = true;
            locateMeBtn.textContent = "Locating...";

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLat = position.coords.latitude;
                    const userLon = position.coords.longitude;

                    map.setView([userLat, userLon], 14);

                    if (userLocationMarker) map.removeLayer(userLocationMarker);

                    userLocationMarker = L.circleMarker([userLat, userLon], {
                        radius: 9,
                        color: "#ffffff",
                        weight: 3,
                        fillColor: "#16834a",
                        fillOpacity: 1
                    })
                    .addTo(map)
                    .bindPopup("Your current location")
                    .openPopup();

                    showMapMessage("Your location is shown. Nearby charger availability has not been verified.");
                    locateMeBtn.disabled = false;
                    locateMeBtn.textContent = "◎ My location";
                },
                (error) => {
                    let message = "Could not get your location.";

                    if (error.code === error.PERMISSION_DENIED) {
                        message = "Location permission denied. Allow it in browser settings.";
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        message = "Current location is unavailable.";
                    } else if (error.code === error.TIMEOUT) {
                        message = "Location request timed out. Try again.";
                    }

                    showMapMessage(message, true);
                    locateMeBtn.disabled = false;
                    locateMeBtn.textContent = "◎ My location";
                },
                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    }

    // 9. HOST FORM - SAVE CHARGER TO BACKEND
    if (hostForm) {
        hostForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            if (!hostForm.checkValidity()) {
                hostForm.reportValidity();
                return;
            }

            const hostName = document.getElementById("hostName").value.trim();
            const hostLocation = document.getElementById("hostLocation").value.trim();
            const hostVehicle = document.getElementById("hostVehicle").value;
            const hostPrice = Number(document.getElementById("hostPrice").value);
            const hostFormMessage = document.getElementById("hostFormMessage");
            const submitButton = hostForm.querySelector('button[type="submit"]');

            if (!hostName || !hostLocation || !hostVehicle ||
                !Number.isFinite(hostPrice) || hostPrice < 0) {
                hostFormMessage.textContent = "Please enter valid form details.";
                hostFormMessage.className = "form-feedback text-danger";
                return;
            }

            const chargerData = {
                name: hostName,
                address: hostLocation,
                vehicleType: hostVehicle,
                pricePerHour: hostPrice,
                available: true
            };

            submitButton.disabled = true;
            submitButton.textContent = "Submitting...";

            try {
                const response = await fetch(API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(chargerData)
                });

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }

                const savedCharger = await response.json();

                hostFormMessage.textContent =
                    `Success! Charger saved in database. ID: ${savedCharger.id}`;
                hostFormMessage.className = "form-feedback text-success";

                hostForm.reset();
                await loadDatabaseChargers();
            } catch (error) {
                console.error("Charger submission failed:", error);
                hostFormMessage.textContent =
                    "Could not save charger. Check that the backend is running.";
                hostFormMessage.className = "form-feedback text-danger";
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = "Submit interest";
            }
        });
    }

    // 10. FOOTER YEAR
    const currentYear = document.getElementById("currentYear");
    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    // 11. INITIAL PAGE STATE
    filterChargers("all");
    loadDatabaseChargers();
});
