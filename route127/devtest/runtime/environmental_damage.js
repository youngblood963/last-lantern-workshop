/* DEVTEST roadside injuries. Legacy roadHurt still handles its combat callers. */
const ENVIRONMENTAL_DAMAGE_POOLS = Object.freeze({
  minor: Object.freeze([1, 2]),
  moderate: Object.freeze([3, 5]),
  severe: Object.freeze([6, 8])
});

function environmentalHurt(severity) {
  const [min, max] = ENVIRONMENTAL_DAMAGE_POOLS[severity];
  const percentage = min + Math.floor(Math.random() * (max - min + 1));
  const damage = Math.max(1, Math.round(player.maxHp * percentage / 100));
  hurt(damage);
  return damage;
}
