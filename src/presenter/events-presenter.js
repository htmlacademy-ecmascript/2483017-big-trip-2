import { render, remove } from '../framework/render.js';
import { SortType, UserAction, UpdateType, FilterType, POINT_TYPES } from '../const.js';
import { sortPointDay, sortPointTime, sortPointPrice } from '../utils/point.js';
import { filter } from '../utils/filter.js';
import UiBlocker from '../framework/ui-blocker/ui-blocker.js';
import NewPointPresenter from './new-point-presenter.js';
import SortView from '../view/sort-view.js';
import TripEventsListView from '../view/trip-events-list-view.js';
import NoPointView from '../view/no-point-view.js';
import LoadingView from '../view/loading-view.js';
import PointPresenter from './point-presenter.js';
import ErrorLoadView from '../view/error-load-view.js';

const TimeLimit = {
  LOWER_LIMIT: 350,
  UPPER_LIMIT: 1000,
};

export default class EventsPresenter {
  #eventsContainer = null;
  #pointsModel = null;
  #filterModel = null;
  #eventsListComponent = new TripEventsListView();
  #pointPresenters = new Map();
  #allDestinations = [];
  #pointTypes = [];
  #sortComponent = null;
  #noPointComponent = null;
  #newPointButtonElement = null;
  #loadingComponent = new LoadingView();
  #errorLoadComponent = new ErrorLoadView();
  #newPointPresenter = null;
  #currentSortType = SortType.DAY;
  #filterType = FilterType.EVERYTHING;
  #isLoading = true;
  #uiBlocker = new UiBlocker({
    lowerLimit: TimeLimit.LOWER_LIMIT,
    upperLimit: TimeLimit.UPPER_LIMIT
  });

  constructor({ eventsContainer, pointsModel, filterModel, newPointButtonElement }) {
    this.#eventsContainer = eventsContainer;
    this.#pointsModel = pointsModel;
    this.#filterModel = filterModel;
    this.#newPointButtonElement = newPointButtonElement;

    this.#newPointPresenter = new NewPointPresenter({
      pointsListContainer: this.#eventsListComponent.element,
      pointsModel: this.#pointsModel,
      onDataChange: this.#handleViewAction,
      onDestroy: this.#handleNewPointDestroy
    });

    this.#pointsModel.addObserver(this.#modelEventHandler);
    this.#filterModel.addObserver(this.#modelEventHandler);
  }

  get points() {
    this.#filterType = this.#filterModel.filter;
    const points = this.#pointsModel.points;
    const filteredPoints = filter[this.#filterType](points);

    switch (this.#currentSortType) {
      case SortType.TIME:
        return filteredPoints.sort(sortPointTime);
      case SortType.PRICE:
        return filteredPoints.sort(sortPointPrice);
    }

    return filteredPoints.sort(sortPointDay);
  }

  init() {
    this.#allDestinations = this.#pointsModel.destinations;
    this.#pointTypes = POINT_TYPES;

    this.#renderBoard();
  }

  createPoint() {
    this.#newPointButtonElement.disabled = true;
    this.#currentSortType = SortType.DAY;

    if (this.#filterModel.filter !== FilterType.EVERYTHING) {
      this.#filterModel.setFilter(UpdateType.MAJOR, FilterType.EVERYTHING);
    }

    this.#handleModeChange();

    if (this.points.length === 0) {
      remove(this.#noPointComponent);
      this.#renderEventsList();
    }

    this.#newPointPresenter.setPointsListContainer(this.#eventsListComponent.element);
    this.#newPointPresenter.init();
  }

  #handleNewPointDestroy = () => {
    this.#newPointButtonElement.disabled = false;

    if (this.points.length === 0) {
      remove(this.#eventsListComponent);
      this.#renderNoPoints();
    }
  };

  #handleModeChange = () => {
    this.#newPointPresenter.destroy();
    this.#pointPresenters.forEach((presenter) => presenter.resetView());
  };

  #handleViewAction = async (actionType, updateType, update) => {
    this.#uiBlocker.block();

    switch (actionType) {
      case UserAction.UPDATE_POINT:
        this.#pointPresenters.get(update.id)?.setSaving();
        try {
          await this.#pointsModel.updatePoint(updateType, update);
        } catch(err) {
          this.#pointPresenters.get(update.id)?.setAborting();
        }
        break;
      case UserAction.ADD_POINT:
        this.#newPointPresenter.setSaving();
        try {
          await this.#pointsModel.addPoint(updateType, update);
        } catch(err) {
          this.#newPointPresenter.setAborting();
        }
        break;
      case UserAction.DELETE_POINT:
        this.#pointPresenters.get(update.id)?.setDeleting();
        try {
          await this.#pointsModel.deletePoint(updateType, update);
        } catch(err) {
          this.#pointPresenters.get(update.id)?.setAborting();
        }
        break;
    }

    this.#uiBlocker.unblock();
  };

  #modelEventHandler = (updateType, data) => {
    switch (updateType) {
      case UpdateType.PATCH:
        this.#pointPresenters.get(data.id)?.init(data, this.#allDestinations, this.#pointTypes);
        break;
      case UpdateType.MINOR:
        this.#clearBoard();
        this.#renderBoard();
        break;
      case UpdateType.MAJOR:
        this.#clearBoard({ resetSortType: true });
        this.#renderBoard();
        break;
      case UpdateType.INIT:
        this.#isLoading = false;
        this.#allDestinations = this.#pointsModel.destinations;
        this.#pointTypes = POINT_TYPES;
        remove(this.#loadingComponent);
        this.#renderBoard();
        break;
    }
  };

  #sortPoints(sortType) {
    this.#currentSortType = sortType;
  }

  #handleSortTypeChange = (sortType) => {
    if (this.#currentSortType === sortType) {
      return;
    }

    this.#sortPoints(sortType);
    this.#clearBoard();
    this.#renderBoard();
  };

  #renderSort() {
    this.#sortComponent = new SortView({
      currentSortType: this.#currentSortType,
      onSortTypeChange: this.#handleSortTypeChange
    });

    render(this.#sortComponent, this.#eventsContainer);
  }

  #renderEventsList() {
    render(this.#eventsListComponent, this.#eventsContainer);
  }

  #renderLoading() {
    render(this.#loadingComponent, this.#eventsContainer);
  }

  #renderErrorLoad() {
    render(this.#errorLoadComponent, this.#eventsContainer);
  }

  #renderNoPoints() {
    this.#noPointComponent = new NoPointView({
      filterType: this.#filterType
    });
    render(this.#noPointComponent, this.#eventsContainer);
  }

  #renderPoints(points) {
    points.forEach((point) => {
      this.#renderPoint(point);
    });
  }

  #clearBoard({ resetSortType = false } = {}) {
    this.#newPointPresenter.destroy();

    this.#pointPresenters.forEach((presenter) => presenter.destroy());
    this.#pointPresenters.clear();

    remove(this.#sortComponent);
    remove(this.#loadingComponent);
    remove(this.#errorLoadComponent);
    remove(this.#eventsListComponent);

    if (this.#noPointComponent) {
      remove(this.#noPointComponent);
    }

    if (resetSortType) {
      this.#currentSortType = SortType.DAY;
    }
  }

  #renderBoard() {
    if (this.#isLoading) {
      this.#newPointButtonElement.disabled = true;
      this.#renderLoading();
      return;
    }

    if (this.#pointsModel.hasError) {
      this.#renderErrorLoad();
      this.#newPointButtonElement.disabled = true;
      return;
    }

    this.#newPointButtonElement.disabled = false;

    const points = this.points;

    if (points.length === 0) {
      this.#renderNoPoints();
      return;
    }

    this.#renderSort();
    this.#renderEventsList();
    this.#renderPoints(points);
  }

  #renderPoint(point) {
    const pointPresenter = new PointPresenter({
      pointsListContainer: this.#eventsListComponent.element,
      pointsModel: this.#pointsModel,
      onDataChange: this.#handleViewAction,
      onModeChange: this.#handleModeChange
    });

    pointPresenter.init(point, this.#allDestinations, this.#pointTypes);
    this.#pointPresenters.set(point.id, pointPresenter);
  }
}
