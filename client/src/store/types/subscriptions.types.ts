import { SubscriptionType } from "./user.types";

export enum SubscriptionActionTypes {
    SET_SUBSCRIPTION_TYPES = 'SET_SUBSCRIPTION_TYPES'
}

export interface SetSubscriptionTypesAction {
    type: SubscriptionActionTypes.SET_SUBSCRIPTION_TYPES;
    payload: SubscriptionType[];
}

export type SubscriptionAction = SetSubscriptionTypesAction;

export interface SubscriptionState {
    subscriptionTypes: SubscriptionType[]
}