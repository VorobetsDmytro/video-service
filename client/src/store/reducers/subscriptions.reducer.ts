import { SubscriptionAction, SubscriptionActionTypes, SubscriptionState } from "../types/subscriptions.types";
import { SubscriptionType } from "../types/user.types";

const defaultState: SubscriptionState = {
    subscriptionTypes: []
}

export const subscriptionsReducer = (state = defaultState, action: SubscriptionAction): SubscriptionState => {
    switch (action.type) {
        case SubscriptionActionTypes.SET_SUBSCRIPTION_TYPES:
            return {
                ...state,
                subscriptionTypes: action.payload
            };
        default:
            return state;
    }
};

export const setSubscriprionTypes = (payload: SubscriptionType[]): SubscriptionAction => ({type: SubscriptionActionTypes.SET_SUBSCRIPTION_TYPES, payload});