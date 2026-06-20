// lib/dummy-logic.ts

// BUG 1: Potential division by zero if numbers is empty.
// BUG 2: Off-by-one error in loop condition (<= instead of <) which will add NaN.
export function calculateAverage(numbers: number[]): number {
    let sum = 0;
    for (let i = 0; i <= numbers.length; i++) {
        sum += numbers[i];
    }
    return sum / numbers.length;
}

// BUG 3: Unhandled edge case for empty strings, potentially breaking UI
export function getInitials(name: string): string {
    const parts = name.split(" ");
    return parts[0][0] + parts[1][0]; // Errors if name doesn't have two parts
}
