import EventsPresenter from './presenter/events-presenter.js';
import FilterPresenter from './presenter/filter-presenter.js';
import PointsModel from './model/points-model.js';
import FilterModel from './model/filter-model.js';
import BigTripApiService from './big-trip-api-service.js';
import TripInfoPresenter from './presenter/trip-info-presenter.js';

const AUTHORIZATION = 'Basic qW1wdW33tyu9cv9p';
const END_POINT = 'https://22.objects.htmlacademy.pro/big-trip';

const siteHeaderElement = document.querySelector('.page-header');
const siteMainElement = document.querySelector('.page-main');

const filtersContainerElement = siteHeaderElement.querySelector('.trip-controls__filters');
const tripEventsElement = siteMainElement.querySelector('.trip-events');
const tripMainElement = siteHeaderElement.querySelector('.trip-main');

const newPointButtonElement = siteHeaderElement.querySelector('.trip-main__event-add-btn');

const pointsModel = new PointsModel({
  bigTripApiService: new BigTripApiService(END_POINT, AUTHORIZATION)
});
const filterModel = new FilterModel();

const eventsPresenter = new EventsPresenter({
  eventsContainer: tripEventsElement,
  pointsModel,
  filterModel,
  newPointButtonElement
});

const filterPresenter = new FilterPresenter({
  filterContainer: filtersContainerElement,
  filterModel,
  pointsModel,
});

const tripInfoPresenter = new TripInfoPresenter({
  tripMainContainer: tripMainElement,
  pointsModel
});

function newPointButtonClickHandler() {
  eventsPresenter.createPoint();
}

filterPresenter.init();
tripInfoPresenter.init();
eventsPresenter.init();

pointsModel.init()
  .finally(() => {
    newPointButtonElement.addEventListener('click', newPointButtonClickHandler);
  });
