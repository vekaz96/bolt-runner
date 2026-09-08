from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
KIT = ROOT / "mobile-game-assests" / "bolt-ui-kit-v1"


def clean_alpha(image: Image.Image, cutoff: int = 8) -> Image.Image:
    image = image.convert("RGBA")
    red, green, blue, alpha = image.split()
    alpha = alpha.point(lambda value: 0 if value <= cutoff else value)
    return Image.merge("RGBA", (red, green, blue, alpha))


def fit_to_canvas(image: Image.Image, size: tuple[int, int], margin: int) -> Image.Image:
    alpha = image.getchannel("A")
    bounds = alpha.getbbox()
    if bounds is None:
        raise ValueError("The selected atlas cell contains no visible artwork")

    artwork = image.crop(bounds)
    max_width = size[0] - margin * 2
    max_height = size[1] - margin * 2
    scale = min(max_width / artwork.width, max_height / artwork.height, 1.0)
    if scale < 1.0:
        artwork = artwork.resize(
            (round(artwork.width * scale), round(artwork.height * scale)),
            Image.Resampling.LANCZOS,
        )

    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    position = ((size[0] - artwork.width) // 2, (size[1] - artwork.height) // 2)
    canvas.alpha_composite(artwork, position)
    return canvas


def export_grid(
    source_name: str,
    output_folder: str,
    names: list[list[str]],
    x_edges: list[int],
    y_edges: list[int],
    canvas_size: tuple[int, int],
    margin: int,
) -> None:
    source = Image.open(KIT / source_name).convert("RGBA")
    destination = KIT / output_folder
    destination.mkdir(parents=True, exist_ok=True)

    for row_index, row in enumerate(names):
        for column_index, name in enumerate(row):
            cell = source.crop(
                (
                    x_edges[column_index],
                    y_edges[row_index],
                    x_edges[column_index + 1],
                    y_edges[row_index + 1],
                )
            )
            exported = fit_to_canvas(clean_alpha(cell), canvas_size, margin)
            exported.save(destination / f"{name}.png", optimize=True)


export_grid(
    "bolt-icons.png",
    "icons",
    [
        ["lightning", "star", "gift", "trophy", "crown", "shield"],
        ["settings", "music", "sound", "mute", "vibration", "profile"],
        ["arrow-left", "arrow-right", "arrow-up", "home", "pause", "play"],
        ["replay", "lock", "check", "close", "edit", "offline"],
    ],
    [0, 270, 524, 778, 1010, 1270, 1536],
    [0, 278, 518, 740, 1024],
    (256, 256),
    8,
)

export_grid(
    "bolt-surfaces.png",
    "surfaces",
    [
        ["button-primary", "button-action"],
        ["button-secondary", "button-disabled"],
        ["panel-wallet", "panel-personal-best"],
        ["panel-daily-reward", "panel-reward-claimed"],
    ],
    [0, 768, 1536],
    [0, 250, 485, 726, 1024],
    (768, 256),
    8,
)
