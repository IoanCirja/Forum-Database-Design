let currentUserId = null;
let currentUserIdPost = null;

module.exports = {
    getCurrentUserId: () => currentUserId,
    setCurrentUserId: (userId) => { currentUserId = userId; },

    getCurrentUserIdPost: () => currentUserIdPost,
    setCurrentUserIdPost: (userId) => { currentUserIdPost = userId; }
};
