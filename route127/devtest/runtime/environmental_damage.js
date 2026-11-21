/* DEVTEST roadside injuries. Legacy roadHurt still handles its combat callers. */
const ENVIRONMENTAL_DAMAGE_POOLS = Object.freeze({
  minor: Object.freeze([1, 2]),
  moderate: Object.freeze([3, 5]),
  severe: Object.freeze([6, 8])
});

function environmentalDamage(severity, maxHp) {
  const [min, max] = ENVIRONMENTAL_DAMAGE_POOLS[severity];
  const percentage = min + Math.floor(Math.random() * (max - min + 1));
  return Math.max(1, Math.round(maxHp * percentage / 100));
}

function environmentalHurt(severity) {
  const damage = environmentalDamage(severity, player.maxHp);
  hurt(damage);
  return damage;
}
