import { render, remove, RenderPosition } from '../framework/render.js';
import EditPointView from '../view/edit-point-view.js';
import { UserAction, UpdateType, BLANK_POINT, POINT_TYPES } from '../const.js';

export default class NewPointPresenter {
  #pointsListContainer = null;
  #pointsModel = null;
  #handleDataChange = null;
  #handleDestroy = null;

  #pointComponent = null;

  constructor({ pointsListContainer, pointsModel, onDataChange, onDestroy }) {
    this.#pointsListContainer = pointsListContainer;
    this.#pointsModel = pointsModel;
    this.#handleDataChange = onDataChange;
    this.#handleDestroy = onDestroy;
  }

  setPointsListContainer(pointsListContainer) {
    this.#pointsListContainer = pointsListContainer;
  }

  init() {
    if (this.#pointComponent !== null) {
      return;
    }

    const allDestinations = this.#pointsModel.destinations;
    const allOffers = this.#pointsModel.offers;
    const pointTypes = POINT_TYPES;

    const offersData = this.#pointsModel.getOffersByType(BLANK_POINT.type);
    const offersByType = offersData ? offersData.offers : [];

    this.#pointComponent = new EditPointView({
      point: BLANK_POINT,
      destination: null,
      allDestinations,
      pointTypes,
      offersByType,
      allOffers,
      isNewPoint: true,
      onFormSubmit: this.#handleFormSubmit,
      onDeleteClick: this.#handleDeleteClick,
      onRollupClick: this.#handleRollupClick
    });

    render(this.#pointComponent, this.#pointsListContainer, RenderPosition.AFTERBEGIN);
    document.addEventListener('keydown', this.#escapeKeyDownHandler);
  }

  destroy() {
    if (this.#pointComponent === null) {
      return;
    }

    this.#handleDestroy();
    remove(this.#pointComponent);
    this.#pointComponent = null;
    document.removeEventListener('keydown', this.#escapeKeyDownHandler);
  }

  setSaving() {
    this.#pointComponent.updateElement({
      isDisabled: true,
      isSaving: true,
    });
  }

  setAborting() {
    const resetFormState = () => {
      if (
        this.#pointComponent === null ||
        !document.body.contains(this.#pointComponent.element)
      ) {
        return;
      }

      this.#pointComponent.updateElement({
        isDisabled: false,
        isSaving: false,
        isDeleting: false,
      });
    };

    this.#pointComponent.shake(resetFormState);
  }

  #handleFormSubmit = (point) => {
    this.#handleDataChange(
      UserAction.ADD_POINT,
      UpdateType.MINOR,
      point
    );
  };

  #handleDeleteClick = () => {
    this.destroy();
  };

  #handleRollupClick = () => {
    this.destroy();
  };

  #escapeKeyDownHandler = (evt) => {
    if (evt.key === 'Escape' || evt.key === 'Esc') {
      evt.preventDefault();
      this.destroy();
    }
  };
}
