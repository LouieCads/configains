// Shared choices for templates (what a program suits) and assessments (what a client answers).
// Values are stored in the database, so renaming a label is safe but renaming a value is not.

export const goals = [
	{ value: 'fat_loss', label: 'Fat loss' },
	{ value: 'maintenance', label: 'Maintenance' },
	{ value: 'muscle_gain', label: 'Muscle gain' }
] as const;

export const experienceLevels = [
	{ value: 'beginner', label: 'New to structured training (under 6 months)' },
	{ value: 'intermediate', label: 'Some consistent training (6 months to 2 years)' },
	{ value: 'advanced', label: 'Experienced (2+ years)' }
] as const;

export const trainingLocations = [
	{ value: 'gym', label: 'Gym' },
	{ value: 'home', label: 'Home' }
] as const;

/** Program variants. Templates use female or male; a client may choose not to say. */
export const sexVariants = [
	{ value: 'female', label: 'Female' },
	{ value: 'male', label: 'Male' }
] as const;

export const dayRange = [2, 6] as const;

export type Goal = (typeof goals)[number]['value'];
export type Experience = (typeof experienceLevels)[number]['value'];
export type TrainingLocation = (typeof trainingLocations)[number]['value'];
export type SexVariant = (typeof sexVariants)[number]['value'];
