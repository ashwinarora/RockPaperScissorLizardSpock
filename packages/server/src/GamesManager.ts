class GamesManager {
    private static instance: GamesManager;

    private constructor() {
        console.log('GamesManager created');
    }

    public static getInstance(): GamesManager {
        if (!GamesManager.instance) {
            GamesManager.instance = new GamesManager();
        }

        return GamesManager.instance;
    }


}

export default GamesManager;