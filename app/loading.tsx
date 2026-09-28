export default function Loading() {
  return (
    <div className="routeLoading" role="status" aria-live="polite">
      <div className="routeLoadingCard">
        <span className="routeSpinner" aria-hidden="true" />
        <div>
          <b>Carregando...</b>
          <small>Preparando a próxima tela</small>
        </div>
      </div>
    </div>
  );
}
