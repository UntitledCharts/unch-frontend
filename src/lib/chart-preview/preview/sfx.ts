import type { EffectItem, ServerItemDetails } from '@sonolus/core'
import { NoteKind, type PreviewChart, type PreviewNote } from './engine/model'
import { parseGzippedJson, parseScp } from './scp'

// Hit sounds for the preview, from a Sonolus effect pack (clips named like #PERFECT, "Sekai Tick").
// The pack's audio is a zip of clip files; each one is decoded once into an AudioBuffer.

export type LoadedEffect = {
    context: AudioContext
    clips: Map<string, AudioBuffer>
}

export const loadEffectFromServer = async (base: string, name: string): Promise<LoadedEffect> => {
    const details = (await fetch(`${base}/sonolus/effects/${name}`).then((r) =>
        r.json(),
    )) as ServerItemDetails<EffectItem>
    const item = details.item

    const [dataBuf, audioBuf] = await Promise.all([
        fetch(`${base}${item.data.url}`).then((r) => r.arrayBuffer()),
        fetch(`${base}${item.audio.url}`).then((r) => r.arrayBuffer()),
    ])
    const data = parseGzippedJson<{ clips: { name: string; filename: string }[] }>(
        new Uint8Array(dataBuf),
    )
    const zip = parseScp(audioBuf)

    const context = new AudioContext()
    const clips = new Map<string, AudioBuffer>()
    await Promise.all(
        data.clips.map(async (clip) => {
            const raw = zip.get(clip.filename)
            if (!raw) return
            try {
                clips.set(clip.name, await context.decodeAudioData(raw.slice().buffer))
            } catch {
                // a clip the browser can't decode just stays silent
            }
        }),
    )
    return { context, clips }
}

const FLICKS: number[] = [
    NoteKind.flick,
    NoteKind.traceFlick,
    NoteKind.headFlick,
    NoteKind.tailFlick,
    NoteKind.headTraceFlick,
    NoteKind.tailTraceFlick,
]
const TRACES: number[] = [NoteKind.trace, NoteKind.headTrace, NoteKind.tailTrace]
const SILENT: number[] = [NoteKind.anchor, NoteKind.hideTick, NoteKind.damage]

const clipFor = (note: PreviewNote): string | undefined => {
    if (note.isFake || SILENT.includes(note.kind)) return
    const c = note.isCritical
    if (note.kind === NoteKind.tick) return c ? 'Sekai Critical Tick' : 'Sekai Tick'
    if (TRACES.includes(note.kind)) return c ? 'Sekai Critical Trace' : 'Sekai Trace'
    if (FLICKS.includes(note.kind)) return c ? 'Sekai Critical Flick' : '#PERFECT_ALTERNATIVE'
    return c ? 'Sekai Critical Tap' : '#PERFECT'
}

export type HitSound = { time: number; clip: string }

// every sound the chart makes, in time order; notes in a chord share one sound per clip
export const hitSounds = (chart: PreviewChart): HitSound[] => {
    const seen = new Set<string>()
    const out: HitSound[] = []
    for (const note of chart.notes) {
        const clip = clipFor(note)
        if (!clip) continue
        const key = `${clip}@${Math.round(note.targetTime * 1000)}`
        if (seen.has(key)) continue
        seen.add(key)
        out.push({ time: note.targetTime, clip })
    }
    return out.sort((a, b) => a.time - b.time)
}

// Schedules sounds a little ahead of the playhead. Call update() every frame while playing and
// reset() whenever the playhead jumps (seek, restart, pause).
export const createSfxPlayer = (effect: LoadedEffect) => {
    const { context, clips } = effect
    const gain = context.createGain()
    gain.connect(context.destination)

    const LOOKAHEAD = 0.12
    let sounds: HitSound[] = []
    let next = 0
    let live: AudioBufferSourceNode[] = []

    const seekIndex = (time: number) => {
        let lo = 0
        let hi = sounds.length
        while (lo < hi) {
            const mid = (lo + hi) >> 1
            if (sounds[mid].time < time) lo = mid + 1
            else hi = mid
        }
        return lo
    }

    return {
        setSounds(list: HitSound[], now: number) {
            sounds = list
            next = seekIndex(now)
        },
        setVolume(volume: number) {
            gain.gain.value = volume
        },
        resume() {
            if (context.state === 'suspended') void context.resume()
        },
        reset(now: number) {
            for (const source of live) source.stop()
            live = []
            next = seekIndex(now)
        },
        update(now: number) {
            while (next < sounds.length && sounds[next].time < now + LOOKAHEAD) {
                const sound = sounds[next++]
                const delay = sound.time - now
                // anything more than a moment late is skipped rather than played off-beat
                if (delay < -0.03) continue
                const buffer = clips.get(sound.clip)
                if (!buffer) continue
                const source = context.createBufferSource()
                source.buffer = buffer
                source.connect(gain)
                source.start(context.currentTime + Math.max(0, delay))
                live.push(source)
                source.onended = () => {
                    live = live.filter((s) => s !== source)
                }
            }
        },
        dispose() {
            for (const source of live) source.stop()
            void context.close()
        },
    }
}

export type SfxPlayer = ReturnType<typeof createSfxPlayer>
