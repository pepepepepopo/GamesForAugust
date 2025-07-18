export function assignTargets(attackers, defenders) {
    // A set of defenders who have already been assigned a primary attacker
    const assignedDefenders = new Set();

    // First pass: each attacker tries to find a unique, closest target
    attackers.forEach(attacker => {
        let bestTarget = null;
        let minDistance = Infinity;

        // Special handling for gorilla jump cooldown
        if (attacker.element.classList.contains('gorilla')) {
            const now = Date.now();
            // Only check cooldown if gorilla has jumped at least once
            if (attacker.hasJumpedOnce && now - attacker.lastJumpTime < attacker.stats.jumpCooldown) {
                attacker.target = null;
                return;
            }
            // Mark that gorilla has jumped and set the timestamp
            if (!attacker.hasJumpedOnce) {
                attacker.hasJumpedOnce = true;
            }
            attacker.lastJumpTime = now;
        }

        defenders.forEach(defender => {
            if (!assignedDefenders.has(defender.id)) {
                let distance;
                
                // For flying units, calculate 2D distance (ignore altitude)
                if (attacker.isFlying || defender.isFlying) {
                    distance = Math.abs(attacker.x - defender.x);
                } else {
                    distance = Math.hypot(attacker.x - defender.x, attacker.y - defender.y);
                }
                
                // Enemy guns can target flying units
                if (attacker.type === 'enemy' && 
                    attacker.element.classList.contains('with-gun') && 
                    defender.isFlying) {
                    // Enemies with guns can shoot at planes
                } else if (attacker.isFlying && !defender.isFlying) {
                    // Flying units can target ground units
                } else if (!attacker.isFlying && defender.isFlying) {
                    // Ground units cannot target flying units (except guns)
                    if (!attacker.element.classList.contains('with-gun') && 
                        !attacker.element.classList.contains('sniper')) {
                        return; // Skip this defender
                    }
                }
                
                if (distance < minDistance) {
                    minDistance = distance;
                    bestTarget = defender;
                }
            }
        });

        if (bestTarget) {
            attacker.target = bestTarget;
            assignedDefenders.add(bestTarget.id);
        } else {
            // All defenders are already targeted, so this attacker has no target yet
            attacker.target = null; 
        }
    });

    // Second pass: any attacker without a target now targets the absolute closest defender
    attackers.forEach(attacker => {
        if (!attacker.target && defenders.length > 0) {
            let closestTarget = null;
            let minDistance = Infinity;

            defenders.forEach(defender => {
                let distance;
                
                // For flying units, calculate 2D distance (ignore altitude)
                if (attacker.isFlying || defender.isFlying) {
                    distance = Math.abs(attacker.x - defender.x);
                } else {
                    distance = Math.hypot(attacker.x - defender.x, attacker.y - defender.y);
                }
                
                // Check if this attacker can target this defender
                if (attacker.type === 'enemy' && 
                    attacker.element.classList.contains('with-gun') && 
                    defender.isFlying) {
                    // Enemies with guns can shoot at planes
                } else if (attacker.isFlying && !defender.isFlying) {
                    // Flying units can target ground units
                } else if (!attacker.isFlying && defender.isFlying) {
                    // Ground units cannot target flying units (except guns)
                    if (!attacker.element.classList.contains('with-gun') && 
                        !attacker.element.classList.contains('sniper')) {
                        return; // Skip this defender
                    }
                }
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestTarget = defender;
                }
            });
            attacker.target = closestTarget;
        }
    });
}

export function assignCarMedicHealTargets(healers, potentialTargets) {
    healers.forEach(healer => {
        // Check global heal cooldown first
        if (Date.now() - healer.lastHealTime < (healer.stats.healCooldown || 3500)) {
            healer.healTarget = null;
            return;
        }

        // Find all allies that are injured enough to be healed by this specific healer.
        // Medics cannot heal other medics.
        const injuredAllies = potentialTargets.filter(p => {
            return p.id !== healer.id && // Can't heal self
                   p.health > 0 &&
                   !p.isDying &&
                   p.health < p.maxHealth && // Is injured
                   p.health < healer.stats.healTargetHP && // Is injured enough (absolute HP)
                   p.stickmanType?.id !== 'medic' && p.stickmanType?.id !== 'car_medic'; // Cannot heal other medics
        });

        if (injuredAllies.length === 0) {
            healer.healTarget = null;
            return;
        }

        // Find the closest injured ally
        let closestTarget = null;
        let minDistance = Infinity;

        injuredAllies.forEach(ally => {
            const distance = Math.hypot(healer.x - ally.x, healer.y - ally.y);
            if (distance < minDistance) {
                minDistance = distance;
                closestTarget = ally;
            }
        });

        healer.healTarget = closestTarget;
    });
}