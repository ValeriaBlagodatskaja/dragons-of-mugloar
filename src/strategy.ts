import type {Message, ShopItem} from './types.js';

const DIFFICULTY_SCORE: Record<string, number> = {
    'piece of cake': 100,
    'sure thing': 95,
    'walk in the park': 90,
    'quite likely': 80,
    'hmmm....': 60,
    'hmmm...': 60,
    'gamble': 45,
    'risky': 30,
    'rather detrimental': 20,
    'playing with fire': 10,
    'suicide mission': 0,
};

export function parseReward(reward: string): number {
    const parsed = Number.parseInt(reward, 10);
    return Number.isFinite(parsed) ? parsed : 0;
}

export function difficultyScore(probability?: string): number {
    if (!probability) return 50;
    return DIFFICULTY_SCORE[probability.trim().toLowerCase()] ?? 50;
}

export function chooseBestMessage(messages: Message[]): Message | undefined {
    return [...messages]
        .filter((message) => difficultyScore(message.probability) >= 80)
        .sort((a, b) => {
            const rewardDifference =
                parseReward(b.reward) - parseReward(a.reward)

            if (rewardDifference !== 0) {
                return rewardDifference
            }

            return difficultyScore(b.probability) -
                difficultyScore(a.probability)
        })[0]
}

export function chooseFallbackMessage(messages: Message[]): Message | undefined {
    return [...messages]
        .filter((message) => {
            const safety = difficultyScore(message.probability)
            return safety >= 45 && safety < 80
        })
        .sort((a, b) => {
            const safetyDifference =
                difficultyScore(b.probability) -
                difficultyScore(a.probability)

            if (safetyDifference !== 0) {
                return safetyDifference
            }

            return parseReward(b.reward) - parseReward(a.reward)
        })[0]
}

export function chooseLastResortMessage(
    messages: Message[],
): Message | undefined {
    return [...messages]
        .filter((message) => difficultyScore(message.probability) < 45)
        .sort((a, b) => {
            const safetyDifference =
                difficultyScore(b.probability) -
                difficultyScore(a.probability)

            if (safetyDifference !== 0) {
                return safetyDifference
            }

            return parseReward(b.reward) - parseReward(a.reward)
        })[0]
}

function isHealingItem(item: ShopItem): boolean {
    return item.id === 'hpot';
}

export function chooseHealingItem(items: ShopItem[], gold: number): ShopItem | undefined {
    return [...items]
        .filter((item) => item.cost <= gold && isHealingItem(item))
        .sort((a, b) => a.cost - b.cost)[0];
}

export function chooseUpgrade(items: ShopItem[], gold: number): ShopItem | undefined {
    // Keep a safety reserve for healing and spend excess gold on an affordable upgrade.
    const reserve = 75;
    return [...items]
        .filter((item) => item.cost <= Math.max(0, gold - reserve) && !isHealingItem(item))
        .sort((a, b) => b.cost - a.cost)[0];
}

