import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { LevelConfig, GameStatus } from '../types';
import { lineIntersect } from '../utils';

interface GameCanvasProps {
  key?: string;
  level: LevelConfig;
  onWin: () => void;
  onGameOver: () => void;
}

export default function GameCanvas({ level, onWin, onGameOver }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const [mouseTrail, setMouseTrail] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Matter.js
    const engine = Matter.Engine.create();
    engineRef.current = engine;
    engine.world.gravity.y = level.gravityY;

    // Create entities
    const cheeseRadius = 20;
    const cheese = Matter.Bodies.circle(level.cheesePos.x, level.cheesePos.y, cheeseRadius, {
      label: 'Cheese',
      restitution: 0.5,
      density: 0.04,
      frictionAir: 0.01,
    });

    const azuroWidth = 80;
    const azuroHeight = 80;
    const azuro = Matter.Bodies.rectangle(level.azuroPos.x, level.azuroPos.y, azuroWidth, azuroHeight, {
      isStatic: true,
      isSensor: true,
      label: 'Azuro'
    });

    const ropes: Matter.Constraint[] = level.ropes.map(rope => {
      return Matter.Constraint.create({
        pointA: { x: rope.x, y: rope.y },
        bodyB: cheese,
        length: rope.length,
        stiffness: 0.8,
        render: { visible: true },
        label: 'Rope'
      });
    });

    const hornets = level.hornets.map(h => {
      return Matter.Bodies.rectangle(h.x, h.y, 40, 40, {
        label: 'Hornet',
        frictionAir: 0.05,
        // Negate gravity for hornets so they float
        inverseInertia: 0,
      });
    });

    Matter.World.add(engine.world, [cheese, azuro, ...ropes, ...hornets]);

    let animationFrameId: number;
    let isDragging = false;
    let lastMousePos: { x: number; y: number } | null = null;
    let trail: { x: number; y: number }[] = [];

    // Collision Events
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        if (labels.includes('Cheese') && labels.includes('Azuro')) {
          onWin();
        }
        if (labels.includes('Cheese') && labels.includes('Hornet')) {
          onGameOver();
        }
      });
    });

    // Update Loop
    const update = () => {
      Matter.Engine.update(engine, 1000 / 60);

      // Hornets follow cheese
      hornets.forEach(hornet => {
        // Negate gravity for hornets
        Matter.Body.applyForce(hornet, hornet.position, {
          x: 0,
          y: -engine.world.gravity.y * engine.world.gravity.scale * hornet.mass
        });

        // Move towards cheese
        const dx = cheese.position.x - hornet.position.x;
        const dy = cheese.position.y - hornet.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
          const forceMag = 0.00005 * hornet.mass;
          Matter.Body.applyForce(hornet, hornet.position, {
            x: (dx / dist) * forceMag,
            y: (dy / dist) * forceMag
          });
        }
      });

      // Out of bounds check
      if (cheese.position.y > 900 || cheese.position.y < -300 || cheese.position.x < -100 || cheese.position.x > 900) {
        onGameOver();
      }

      // Decrease trail lifespan
      if (!isDragging && trail.length > 0) {
        trail = trail.slice(1);
        setMouseTrail([...trail]);
      }

      render();
      animationFrameId = requestAnimationFrame(update);
    };

    const render = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, 800, 600);

      // Draw Lab Background
      const isChallenge = level.isChallenge;
      ctx.fillStyle = isChallenge ? '#1a1a2e' : '#2b3a4a';
      ctx.fillRect(0, 0, 800, 600);

      // Grid / Tiles
      ctx.strokeStyle = isChallenge ? '#2a2a4e' : '#3b4a5a';
      ctx.lineWidth = 2;
      for (let i = 0; i < 800; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 600); ctx.stroke();
      }
      for (let i = 0; i < 600; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(800, i); ctx.stroke();
      }

      // Pipes
      ctx.fillStyle = isChallenge ? '#2d3748' : '#4a5a6a';
      ctx.fillRect(50, 0, 30, 600);
      ctx.fillStyle = isChallenge ? '#4a5568' : '#5a6a7a';
      ctx.fillRect(55, 0, 10, 600); // Pipe highlight
      ctx.fillStyle = isChallenge ? '#2d3748' : '#4a5a6a';
      ctx.fillRect(720, 0, 30, 600);

      // Chalkboard or screen
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(200, 100, 400, 300);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 8;
      ctx.strokeRect(200, 100, 400, 300);
      
      // Blueprint scribbles
      ctx.strokeStyle = '#38bdf8'; // cyan
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(300, 250, 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(300, 250);
      ctx.lineTo(400, 150);
      ctx.stroke();
      ctx.font = '20px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'left';
      ctx.fillText('E = mc²', 450, 180);
      ctx.fillText('g = ' + (isChallenge ? '-9.81' : '9.81'), 450, 220);

      // Danger stripes on top/bottom based on gravity
      ctx.save();
      const hazardY = isChallenge ? 0 : 580;
      ctx.beginPath();
      ctx.rect(0, hazardY, 800, 20);
      ctx.clip();
      ctx.fillStyle = '#f59e0b'; // amber
      ctx.fillRect(0, hazardY, 800, 20);
      ctx.fillStyle = '#000';
      for (let i = -20; i < 820; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, hazardY);
        ctx.lineTo(i + 20, hazardY);
        ctx.lineTo(i + 10, hazardY + 20);
        ctx.lineTo(i - 10, hazardY + 20);
        ctx.fill();
      }
      ctx.restore();

      // Draw Ropes
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#8B4513';
      ropes.forEach(rope => {
        if (!rope.bodyB) return; // Cut rope
        ctx.beginPath();
        ctx.moveTo(rope.pointA.x, rope.pointA.y);
        ctx.lineTo(
          rope.bodyB.position.x + rope.pointB.x,
          rope.bodyB.position.y + rope.pointB.y
        );
        ctx.stroke();

        // Draw anchor point
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(rope.pointA.x, rope.pointA.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Azuro (Blue kitten with goggles)
      ctx.save();
      ctx.translate(azuro.position.x, azuro.position.y);
      if (level.gravityY < 0) ctx.scale(1, -1); // Flip if inverted gravity
      
      // Face
      ctx.fillStyle = '#3b82f6'; // Blue
      ctx.beginPath();
      ctx.arc(0, 0, 40, 0, Math.PI * 2);
      ctx.fill();
      
      // Ears
      ctx.beginPath();
      ctx.moveTo(-30, -20);
      ctx.lineTo(-40, -50);
      ctx.lineTo(-10, -35);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(30, -20);
      ctx.lineTo(40, -50);
      ctx.lineTo(10, -35);
      ctx.fill();

      // Goggles
      ctx.fillStyle = '#333';
      ctx.fillRect(-40, -10, 80, 5); // Strap
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-15, -10, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(15, -10, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Eyes in goggles
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-15, -10, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(15, -10, 4, 0, Math.PI * 2);
      ctx.fill();

      // Mouth
      ctx.fillStyle = '#000';
      const distToCheese = Math.sqrt(Math.pow(cheese.position.x - azuro.position.x, 2) + Math.pow(cheese.position.y - azuro.position.y, 2));
      if (distToCheese < 150) {
        // Open mouth
        ctx.beginPath();
        ctx.arc(0, 15, 10, 0, Math.PI, false);
        ctx.fill();
      } else {
        // Smile
        ctx.beginPath();
        ctx.arc(0, 10, 8, 0, Math.PI, false);
        ctx.stroke();
      }
      ctx.restore();

      // Draw Cheese
      ctx.save();
      ctx.translate(cheese.position.x, cheese.position.y);
      ctx.rotate(cheese.angle);
      ctx.font = '40px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🧀', 0, 0);
      ctx.restore();

      // Draw Hornets
      hornets.forEach(hornet => {
        ctx.save();
        ctx.translate(hornet.position.x, hornet.position.y);
        ctx.rotate(hornet.angle);
        
        // Direction facing (rocket and hornet)
        const dx = cheese.position.x - hornet.position.x;
        if (dx < 0) ctx.scale(-1, 1);
        
        // Draw Rocket
        ctx.fillStyle = '#cbd5e1'; // body
        ctx.fillRect(-15, -25, 30, 10);
        ctx.fillStyle = '#ef4444'; // tip
        ctx.beginPath();
        ctx.moveTo(15, -25);
        ctx.lineTo(25, -20);
        ctx.lineTo(15, -15);
        ctx.fill();
        ctx.fillStyle = '#94a3b8'; // fin
        ctx.beginPath();
        ctx.moveTo(-10, -25);
        ctx.lineTo(-15, -30);
        ctx.lineTo(-5, -25);
        ctx.fill();
        
        // Rocket Fire
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(-15, -23);
        ctx.lineTo(-25 - Math.random() * 8, -20);
        ctx.lineTo(-15, -17);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.moveTo(-15, -22);
        ctx.lineTo(-20 - Math.random() * 4, -20);
        ctx.lineTo(-15, -18);
        ctx.fill();

        // Strap
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(0, 0);
        ctx.stroke();

        // Draw Hornet Body
        ctx.fillStyle = '#fbbf24'; // yellow
        ctx.beginPath();
        ctx.ellipse(0, 5, 16, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stripes
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.ellipse(-4, 5, 3, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(4, 5, 3, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stinger
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.moveTo(-14, 5);
        ctx.lineTo(-22, 5);
        ctx.lineTo(-14, 8);
        ctx.fill();

        // Head
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(14, 2, 7, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(16, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(17, 0, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Angry Eyebrow
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(13, -3);
        ctx.lineTo(18, -1);
        ctx.stroke();

        // Wings
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(4, -4, 10, 5, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(-2, -5, 8, 4, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      });

      // Draw Mouse Trail (Swipe)
      if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
          ctx.lineTo(trail[i].x, trail[i].y);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    };

    update();

    // Interaction handlers
    const getMousePos = (e: MouseEvent | TouchEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      return {
        x: (clientX - rect.left) * (800 / rect.width),
        y: (clientY - rect.top) * (600 / rect.height)
      };
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      isDragging = true;
      lastMousePos = getMousePos(e);
      trail = [lastMousePos];
      setMouseTrail([...trail]);
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !lastMousePos) return;
      e.preventDefault();
      
      const currentMousePos = getMousePos(e);
      trail.push(currentMousePos);
      if (trail.length > 10) trail.shift();
      setMouseTrail([...trail]);

      // Check intersections with ropes
      ropes.forEach((rope, index) => {
        if (!rope.bodyB) return; // Already cut
        
        const ropeStartX = rope.pointA.x;
        const ropeStartY = rope.pointA.y;
        const ropeEndX = rope.bodyB.position.x + rope.pointB.x;
        const ropeEndY = rope.bodyB.position.y + rope.pointB.y;

        if (lineIntersect(
          lastMousePos!.x, lastMousePos!.y,
          currentMousePos.x, currentMousePos.y,
          ropeStartX, ropeStartY,
          ropeEndX, ropeEndY
        )) {
          // Cut rope
          Matter.World.remove(engine.world, rope);
          ropes[index].bodyB = null as any; // Mark as cut
        }
      });

      lastMousePos = currentMousePos;
    };

    const handleEnd = () => {
      isDragging = false;
      lastMousePos = null;
    };

    const canvas = canvasRef.current;
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseleave', handleEnd);
    
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd);

    return () => {
      cancelAnimationFrame(animationFrameId);
      Matter.Engine.clear(engine);
      
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseup', handleEnd);
      canvas.removeEventListener('mouseleave', handleEnd);
      
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      canvas.removeEventListener('touchend', handleEnd);
    };
  }, [level]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      className="w-full max-w-4xl h-auto bg-white rounded-2xl shadow-2xl border-4 border-indigo-900 overflow-hidden cursor-crosshair touch-none"
    />
  );
}
