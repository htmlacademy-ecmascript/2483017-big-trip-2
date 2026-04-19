import { render, replace, remove } from '../framework/render.js';
import { UserAction, UpdateType } from '../const.js';
import { isDatesEqual } from '../utils/point.js';
import PointView from '../view/point-view.js';
import EditPointView from '../view/edit-point-view.js';

const Mode = {
  DEFAULT: 'DEFAULT',
  EDITING: 'EDITING',
};

export default class PointPresenter {
  #pointsListContainer = null;
  #pointsModel = null;
  #handleDataChange = null;
  #handleModeChange = null;

  #pointComponent = null;
  #editPointComponent = null;
  #point = null;
  #mode = Mode.DEFAULT;

  constructor({ pointsListContainer, pointsModel, onDataChange, onModeChange }) {
    this.#pointsListContainer = pointsListContainer;
    this.#pointsModel = pointsModel;
    this.#handleDataChange = onDataChange;
    this.#handleModeChange = onModeChange;
  }

  init(point, allDestinations, pointTypes) {
    this.#point = point;

    const previousPointComponent = this.#pointComponent;
    const previousEditPointComponent = this.#editPointComponent;

    const destination = this.#pointsModel.getDestinationById(point.destination);
    const offersData = this.#pointsModel.getOffersByType(point.type);
    const offersByType = offersData ? offersData.offers : [];
    const selectedOffers = offersByType.filter((offer) => point.offers.includes(offer.id));

    this.#pointComponent = new PointView({
      point,
      destination,
      offers: selectedOffers,
      onEditClick: this.#handleEditClick,
      onFavoriteClick: this.#handleFavoriteClick
    });

    this.#editPointComponent = new EditPointView({
      point,
      destination,
      allDestinations,
      pointTypes,
      offersByType,
      allOffers: this.#pointsModel.offers,
      onFormSubmit: this.#handleFormSubmit,
      onDeleteClick: this.#handleDeleteClick,
      onRollupClick: this.#handleRollupClick
    });

    if (previousPointComponent === null || previousEditPointComponent === null) {
      render(this.#pointComponent, this.#pointsListContainer);
      return;
    }

    if (this.#mode === Mode.DEFAULT) {
      replace(this.#pointComponent, previousPointComponent);
    }

    if (this.#mode === Mode.EDITING) {
      replace(this.#pointComponent, previousEditPointComponent);
      this.#mode = Mode.DEFAULT;
    }

    remove(previousPointComponent);
    remove(previousEditPointComponent);
  }

  destroy() {
    remove(this.#pointComponent);
    remove(this.#editPointComponent);
  }

  resetView() {
    if (this.#mode !== Mode.DEFAULT) {
      this.#resetEditPointComponent();
      this.#replaceEditToPoint();
    }
  }

  setSaving() {
    if (this.#mode === Mode.EDITING) {
      this.#editPointComponent.updateElement({
        isDisabled: true,
        isSaving: true,
      });
    }
  }

  setDeleting() {
    if (this.#mode === Mode.EDITING) {
      this.#editPointComponent.updateElement({
        isDisabled: true,
        isDeleting: true,
      });
    }
  }

  setAborting() {
    if (this.#mode === Mode.DEFAULT) {
      this.#pointComponent.shake();
      return;
    }

    const resetFormState = () => {
      if (
        this.#editPointComponent === null ||
        this.#mode !== Mode.EDITING ||
        !document.body.contains(this.#editPointComponent.element)
      ) {
        return;
      }

      this.#editPointComponent.updateElement({
        isDisabled: false,
        isSaving: false,
        isDeleting: false,
      });
    };

    this.#editPointComponent.shake(resetFormState);
  }

  #replacePointToEdit() {
    replace(this.#editPointComponent, this.#pointComponent);
    document.addEventListener('keydown', this.#escapeKeyDownHandler);
    this.#handleModeChange();
    this.#mode = Mode.EDITING;
  }

  #replaceEditToPoint() {
    replace(this.#pointComponent, this.#editPointComponent);
    document.removeEventListener('keydown', this.#escapeKeyDownHandler);
    this.#mode = Mode.DEFAULT;
  }

  #handleEditClick = () => {
    this.#replacePointToEdit();
  };

  #handleFavoriteClick = () => {
    this.#handleDataChange(
      UserAction.UPDATE_POINT,
      UpdateType.PATCH,
      {
        ...this.#point,
        isFavorite: !this.#point.isFavorite
      }
    );
  };

  #handleFormSubmit = (updatedPoint) => {
    const isMinorUpdate =
      !isDatesEqual(this.#point.dateFrom, updatedPoint.dateFrom) ||
      !isDatesEqual(this.#point.dateTo, updatedPoint.dateTo) ||
      this.#point.basePrice !== updatedPoint.basePrice;

    this.#handleDataChange(
      UserAction.UPDATE_POINT,
      isMinorUpdate ? UpdateType.MINOR : UpdateType.PATCH,
      updatedPoint
    );
  };

  #handleDeleteClick = (point) => {
    this.#handleDataChange(
      UserAction.DELETE_POINT,
      UpdateType.MINOR,
      point
    );
  };

  #handleRollupClick = () => {
    this.#replaceEditToPoint();
  };

  #resetEditPointComponent() {
    const destination = this.#pointsModel.getDestinationById(this.#point.destination);
    const offersData = this.#pointsModel.getOffersByType(this.#point.type);
    const offersByType = offersData ? offersData.offers : [];

    this.#editPointComponent.reset(this.#point, destination, offersByType);
  }

  #escapeKeyDownHandler = (evt) => {
    if (evt.key === 'Escape') {
      evt.preventDefault();
      this.#resetEditPointComponent();
      this.#replaceEditToPoint();
    }
  };
}
