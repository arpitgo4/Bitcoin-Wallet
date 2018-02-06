
let AppState = {
    privateKey: ''
};

export const setAppState = (state, componentRef) => {
    AppState = Object.assign(AppState, state);
    if(componentRef)
        componentRef.forceUpdate();
    else console.warn('ComponentRef is null. Component will not re-render!!');
};

export const getAppState = () => AppState;

