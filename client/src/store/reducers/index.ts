import { combineReducers } from "redux";
import { adminReducer } from "./admin.reducer";
import { subscriptionsReducer } from "./subscriptions.reducer";
import { userReducer } from "./user.reducer";
import { videosReducer } from "./videos.reducer";

export const rootReducer = combineReducers({
    user: userReducer,
    video: videosReducer,
    subscription: subscriptionsReducer,
    admin: adminReducer
});

export type RootState = ReturnType<typeof rootReducer>;