import { render, replace, remove, RenderPosition } from '../framework/render.js';
import { UpdateType } from '../const.js';
import TripInfoView from '../view/trip-info-view.js';
import { sortPointDay, humanizeTripDates } from '../utils/point.js';

const MAX_VISIBLE_DESTINATIONS = 3;

export default class TripInfoPresenter {
  #tripMainContainer = null;
  #pointsModel = null;
  #tripInfoComponent = null;

  constructor({tripMainContainer, pointsModel}) {
    this.#tripMainContainer = tripMainContainer;
    this.#pointsModel = pointsModel;

    this.#pointsModel.addObserver(this.#handleModelEvent);
  }

  init() {
    const points = [...this.#pointsModel.points].sort(sortPointDay);
    const previousTripInfoComponent = this.#tripInfoComponent;

    if (!points.length) {
      if (previousTripInfoComponent !== null) {
        remove(previousTripInfoComponent);
        this.#tripInfoComponent = null;
      }
      return;
    }

    const tripInfo = this.#createTripInfo(points);
    this.#tripInfoComponent = new TripInfoView({ tripInfo });

    if (previousTripInfoComponent === null) {
      render(this.#tripInfoComponent, this.#tripMainContainer, RenderPosition.AFTERBEGIN);
      return;
    }

    replace(this.#tripInfoComponent, previousTripInfoComponent);
    remove(previousTripInfoComponent);
  }

  #handleModelEvent = (updateType) => {
    switch (updateType) {
      case UpdateType.PATCH:
      case UpdateType.MINOR:
      case UpdateType.MAJOR:
      case UpdateType.INIT:
        this.init();
        break;
    }
  };

  #createTripInfo(points) {
    return {
      route: this.#getRoute(points),
      date: this.#getTripDates(points),
      totalPrice: this.#getTotalPrice(points)
    };
  }

  #getRoute(points) {
    const destinations = points
      .map((point) => this.#pointsModel.getDestinationById(point.destination))
      .filter((destination) => destination)
      .map((destination) => destination.name);

    if (destinations.length <= MAX_VISIBLE_DESTINATIONS) {
      return destinations.join(' — ');
    }

    return `${destinations[0]} — ... — ${destinations[destinations.length - 1]}`;
  }

  #getTripDates(points) {
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    return humanizeTripDates(firstPoint.dateFrom, lastPoint.dateTo);
  }

  #getTotalPrice(points) {
    return points.reduce((total, point) => {
      const offersByType = this.#pointsModel.getOffersByType(point.type);

      const selectedOffersPrice = point.offers.reduce((sum, offerId) => {
        const offer = offersByType?.offers.find((item) => item.id === offerId);
        return sum + (offer ? offer.price : 0);
      }, 0);

      return total + point.basePrice + selectedOffersPrice;
    }, 0);
  }
}
